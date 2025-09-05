import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as nacl from "https://esm.sh/tweetnacl@1.0.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface LinkWalletRequest {
  wallet_address: string;
  signature: string;
  message: string;
  wallet_type?: 'primary' | 'secondary';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authenticated user (using separate client for auth verification)
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : authHeader;

    const { data: { user }, error: authError } = await authClient.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 200, headers: corsHeaders }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Parse JSON body safely
    const contentType = req.headers.get('content-type') || '';
    const contentLength = req.headers.get('content-length') || '';

    const rawBody = await req.text();
    let body: LinkWalletRequest | null = null;
    try {
      body = rawBody ? JSON.parse(rawBody) as LinkWalletRequest : null;
    } catch (parseErr) {
      console.error('Body parse error:', { contentType, contentLength, rawSample: rawBody?.slice(0, 200) }, parseErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { status: 200, headers: corsHeaders }
      );
    }

    if (!body) {
      console.error('Empty body received for link-secondary-wallet', { contentType, contentLength });
      return new Response(
        JSON.stringify({ success: false, error: 'Request body is required' }),
        { status: 200, headers: corsHeaders }
      );
    }

    const { wallet_address, signature, message, wallet_type = 'secondary' } = body;

    console.log('link-secondary-wallet request:', { 
      user_id: user.id,
      wallet_address,
      wallet_type,
      message_length: message?.length,
      signature_length: signature?.length
    });

    if (!wallet_address || !signature || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: wallet_address, signature, message' }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Validate message format (accept space or newline after "wallet" and both CRLF/LF)
    const expectedMessagePattern = /^I am linking this wallet[\r\n ]+(.+?) to my ANIME\.TOKEN account\.\r?\n\r?\nTimestamp: \d+$/;
    if (!expectedMessagePattern.test(message)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid message format' }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Extract wallet address from message
    const messageWalletMatch = message.match(/^I am linking this wallet[\r\n ]+(.+?) to my ANIME\.TOKEN account\./m);
    if (!messageWalletMatch || messageWalletMatch[1] !== wallet_address) {
      return new Response(
        JSON.stringify({ success: false, error: 'Wallet address in message does not match provided wallet address' }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Verify signature
    try {
      // Import both bs58 and tweetnacl dynamically
      const [bs58Module, naclModule] = await Promise.all([
        import("https://esm.sh/bs58@5.0.0"),
        import("https://esm.sh/tweetnacl@1.0.3")
      ]);
      
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58Module.default.decode(signature);
      const publicKeyBytes = bs58Module.default.decode(wallet_address);
      
      const isValid = naclModule.default.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      
      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid signature' }),
          { status: 200, headers: corsHeaders }
        );
      }
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return new Response(
        JSON.stringify({ success: false, error: 'Signature verification failed' }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Check timestamp (should be within last 60 minutes for secondary wallets)
    const timestampMatch = message.match(/Timestamp: (\d+)$/);
    if (timestampMatch) {
      const messageTimestamp = parseInt(timestampMatch[1]);
      const now = Date.now();
      const sixtyMinutes = 60 * 60 * 1000;
      
      if (Math.abs(now - messageTimestamp) > sixtyMinutes) {
        console.error('Timestamp validation failed:', {
          messageTimestamp,
          currentTime: now,
          difference: Math.abs(now - messageTimestamp),
          maxAllowed: sixtyMinutes
        });
        return new Response(
          JSON.stringify({ success: false, error: 'Message timestamp is too old or too far in the future. Please generate a new message.' }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // For primary wallet, check if user already has one
    if (wallet_type === 'primary') {
      const { data: existingPrimary } = await supabaseClient
        .from('user_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('wallet_type', 'primary')
        .maybeSingle();
      
      if (existingPrimary) {
        return new Response(
          JSON.stringify({ success: false, error: 'User already has a primary wallet' }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // Check if wallet is already linked to any user
    const { data: existingWallet } = await supabaseClient
      .from('user_wallets')
      .select('user_id, wallet_type')
      .eq('wallet_address', wallet_address)
      .maybeSingle();
    
    if (existingWallet) {
      if (existingWallet.user_id === user.id) {
        return new Response(
          JSON.stringify({ success: false, error: 'This wallet is already linked to your account' }),
          { status: 200, headers: corsHeaders }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'This wallet is already linked to another account' }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // Add the wallet to user_wallets (handle schemas that may not have verification columns)
    let insertResult = await supabaseClient
      .from('user_wallets')
      .insert({
        user_id: user.id,
        wallet_address,
        wallet_type,
        is_verified: true,
        verification_signature: signature,
        verification_message: message,
        linked_at: new Date().toISOString()
      })
      .select()
      .single();

    let newWallet = insertResult.data;
    let insertError = insertResult.error as any;

    if (insertError) {
      console.error('Database insert error (attempt 1):', insertError);

      // Fallback for schemas without verification_* columns
      const isUndefinedColumn = insertError?.code === '42703' ||
        (typeof insertError?.message === 'string' &&
         (insertError.message.includes('verification_signature') || insertError.message.includes('verification_message') || insertError.message.includes('column')));

      if (isUndefinedColumn) {
        const fallback = await supabaseClient
          .from('user_wallets')
          .insert({
            user_id: user.id,
            wallet_address,
            wallet_type,
            is_verified: true,
            linked_at: new Date().toISOString()
          })
          .select()
          .single();

        newWallet = fallback.data;
        insertError = fallback.error;
      }
    }

    if (insertError) {
      console.error('Database insert error (final):', insertError, {
        user_id: user.id,
        wallet_address,
        wallet_type,
        error_code: insertError.code,
        error_details: insertError.details
      });
      
      // Handle specific error cases
      if (typeof insertError.message === 'string' && insertError.message.includes('more than 10 secondary wallets')) {
        return new Response(
          JSON.stringify({ success: false, error: 'You cannot link more than 10 secondary wallets' }),
          { status: 200, headers: corsHeaders }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to link wallet', details: insertError.message }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log('link-secondary-wallet success:', { 
      user_id: user.id,
      wallet_id: newWallet.id,
      wallet_address,
      wallet_type
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        wallet: {
          id: newWallet.id,
          wallet_address: newWallet.wallet_address,
          wallet_type: newWallet.wallet_type,
          linked_at: newWallet.linked_at
        }
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('link-secondary-wallet error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 200, headers: corsHeaders }
    );
  }
});