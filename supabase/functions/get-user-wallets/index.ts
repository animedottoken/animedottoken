import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with proper auth context
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

    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    console.log('get-user-wallets request:', { user_id: user.id });

    // Get all user wallets directly from table with proper RLS context
    const { data: wallets, error: walletsError } = await supabaseClient
      .from('user_wallets')
      .select('id, wallet_address, wallet_type, is_verified, linked_at')
      .eq('user_id', user.id)
      .eq('is_verified', true)
      .order('wallet_type') // primary first, then secondary
      .order('linked_at');

    if (walletsError) {
      console.error('Database query error:', walletsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch wallets' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Also get wallet counts
    const { data: walletCounts, error: countsError } = await supabaseClient
      .from('user_wallets')
      .select('wallet_type')
      .eq('user_id', user.id)
      .eq('is_verified', true);

    if (countsError) {
      console.error('Wallet counts error:', countsError);
    }

    const primaryCount = walletCounts?.filter(w => w.wallet_type === 'primary').length || 0;
    const secondaryCount = walletCounts?.filter(w => w.wallet_type === 'secondary').length || 0;

    console.log('get-user-wallets success:', { 
      user_id: user.id,
      total_wallets: wallets?.length || 0,
      primary_wallets: primaryCount,
      secondary_wallets: secondaryCount
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        wallets: wallets || [],
        summary: {
          total: wallets?.length || 0,
          primary: primaryCount,
          secondary: secondaryCount,
          remaining_secondary_slots: Math.max(0, 10 - secondaryCount)
        }
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('get-user-wallets error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});