import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { verify } from 'https://esm.sh/tweetnacl@1.0.3';
import { decode as decodeBase58 } from 'https://esm.sh/bs58@5.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReclaimWalletRequest {
  wallet_address: string;
  signature: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { wallet_address, signature, message }: ReclaimWalletRequest = await req.json();

    if (!wallet_address || !signature || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Reclaim wallet request:', { user_id: user.id, wallet_address });

    // Validate message format and extract wallet address
    const messageRegex = /I want to reclaim control of wallet ([\w]{32,44}) and link it to my current account\.\s*Timestamp: (\d+)/;
    const messageMatch = message.match(messageRegex);
    
    if (!messageMatch) {
      return new Response(JSON.stringify({ error: 'Invalid message format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const messageWallet = messageMatch[1];
    const messageTimestamp = parseInt(messageMatch[2]);

    if (messageWallet !== wallet_address) {
      return new Response(JSON.stringify({ error: 'Wallet address mismatch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check timestamp (must be within last 10 minutes)
    const now = Date.now();
    if (now - messageTimestamp > 10 * 60 * 1000) {
      return new Response(JSON.stringify({ error: 'Message timestamp too old' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify signature
    try {
      const signatureBytes = decodeBase58(signature);
      const messageBytes = new TextEncoder().encode(message);
      const publicKeyBytes = decodeBase58(wallet_address);
      
      const isValidSignature = verify(messageBytes, signatureBytes, publicKeyBytes);
      if (!isValidSignature) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('Signature verification error:', error);
      return new Response(JSON.stringify({ error: 'Signature verification failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if wallet is currently linked to another user
    const { data: existingWallet, error: walletError } = await supabaseAdmin
      .from('user_wallets')
      .select('user_id, wallet_type')
      .eq('wallet_address', wallet_address)
      .eq('is_verified', true)
      .maybeSingle();

    if (walletError) {
      console.error('Database error checking existing wallet:', walletError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!existingWallet) {
      return new Response(JSON.stringify({ error: 'Wallet not found or not linked' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (existingWallet.user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Wallet is already linked to your account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Start transaction to reclaim wallet
    const { error: reclaimError } = await supabaseAdmin.rpc('begin');
    if (reclaimError) {
      console.error('Transaction start error:', reclaimError);
    }

    try {
      // Remove wallet from previous user
      const { error: deleteError } = await supabaseAdmin
        .from('user_wallets')
        .delete()
        .eq('wallet_address', wallet_address);

      if (deleteError) {
        throw deleteError;
      }

      // Add wallet to current user (preserve the original wallet type)
      const { error: insertError } = await supabaseAdmin
        .from('user_wallets')
        .insert({
          user_id: user.id,
          wallet_address: wallet_address,
          wallet_type: existingWallet.wallet_type,
          is_verified: true,
          verification_signature: signature,
          verification_message: message
        });

      if (insertError) {
        throw insertError;
      }

      // Log the reclaim action
      const { error: logError } = await supabaseAdmin
        .from('security_events')
        .insert({
          event_type: 'wallet_reclaimed',
          severity: 'info',
          user_id: user.id,
          wallet_address: wallet_address,
          metadata: {
            previous_user_id: existingWallet.user_id,
            wallet_type: existingWallet.wallet_type,
            timestamp: now
          }
        });

      if (logError) {
        console.error('Security log error:', logError);
        // Don't fail the request for logging errors
      }

      // Update user profile if this was a primary wallet
      if (existingWallet.wallet_type === 'primary') {
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            wallet_address: wallet_address,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      console.log('Wallet reclaimed successfully:', { 
        user_id: user.id, 
        wallet_address,
        previous_user_id: existingWallet.user_id 
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Wallet reclaimed successfully',
        wallet_type: existingWallet.wallet_type
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Reclaim transaction error:', error);
      
      // Rollback transaction
      const { error: rollbackError } = await supabaseAdmin.rpc('rollback');
      if (rollbackError) {
        console.error('Transaction rollback error:', rollbackError);
      }
      
      return new Response(JSON.stringify({ 
        error: 'Failed to reclaim wallet',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Reclaim wallet error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});