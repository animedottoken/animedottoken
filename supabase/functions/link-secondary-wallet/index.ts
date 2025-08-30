import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as nacl from "https://esm.sh/tweetnacl@1.0.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user (extract JWT from header explicitly)
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : authHeader;

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    const { wallet_address, signature, message, wallet_type = 'secondary' }: LinkWalletRequest = await req.json();

    console.log('link-secondary-wallet request:', { 
      user_id: user.id,
      wallet_address,
      wallet_type,
      message_length: message?.length,
      signature_length: signature?.length
    });

    if (!wallet_address || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: wallet_address, signature, message' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate message format
    const expectedMessagePattern = /^I am linking this wallet .+ to my ANIME\.TOKEN account\.\n\nTimestamp: \d+$/;
    if (!expectedMessagePattern.test(message)) {
      return new Response(
        JSON.stringify({ error: 'Invalid message format' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract wallet address from message
    const messageWalletMatch = message.match(/I am linking this wallet (.+) to my ANIME\.TOKEN account\./);
    if (!messageWalletMatch || messageWalletMatch[1] !== wallet_address) {
      return new Response(
        JSON.stringify({ error: 'Wallet address in message does not match provided wallet address' }),
        { status: 400, headers: corsHeaders }
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
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: corsHeaders }
        );
      }
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Signature verification failed' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check timestamp (should be within last 10 minutes)
    const timestampMatch = message.match(/Timestamp: (\d+)$/);
    if (timestampMatch) {
      const messageTimestamp = parseInt(timestampMatch[1]);
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      
      if (Math.abs(now - messageTimestamp) > tenMinutes) {
        return new Response(
          JSON.stringify({ error: 'Message timestamp is too old or too far in the future' }),
          { status: 400, headers: corsHeaders }
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
          JSON.stringify({ error: 'User already has a primary wallet' }),
          { status: 400, headers: corsHeaders }
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
          JSON.stringify({ error: 'This wallet is already linked to your account' }),
          { status: 400, headers: corsHeaders }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'This wallet is already linked to another account' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Add the wallet to user_wallets
    const { data: newWallet, error: insertError } = await supabaseClient
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

    if (insertError) {
      console.error('Database insert error:', insertError);
      
      // Handle specific error cases
      if (insertError.message.includes('more than 10 secondary wallets')) {
        return new Response(
          JSON.stringify({ error: 'You cannot link more than 10 secondary wallets' }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to link wallet' }),
        { status: 500, headers: corsHeaders }
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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});