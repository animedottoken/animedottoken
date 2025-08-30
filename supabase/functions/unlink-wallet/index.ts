import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnlinkWalletRequest {
  wallet_id: string;
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

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
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

    const { wallet_id }: UnlinkWalletRequest = await req.json();

    console.log('unlink-wallet request:', { 
      user_id: user.id,
      wallet_id
    });

    if (!wallet_id) {
      return new Response(
        JSON.stringify({ error: 'Missing wallet_id' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // First check if wallet exists and belongs to user
    const { data: wallet, error: fetchError } = await supabaseClient
      .from('user_wallets')
      .select('wallet_type, wallet_address')
      .eq('id', wallet_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !wallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found or not owned by user' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Prevent unlinking primary wallet
    if (wallet.wallet_type === 'primary') {
      return new Response(
        JSON.stringify({ error: 'Cannot unlink primary wallet' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Delete the wallet
    const { error: deleteError } = await supabaseClient
      .from('user_wallets')
      .delete()
      .eq('id', wallet_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to unlink wallet' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('unlink-wallet success:', { 
      user_id: user.id,
      wallet_id,
      wallet_address: wallet.wallet_address
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Wallet unlinked successfully'
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('unlink-wallet error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});