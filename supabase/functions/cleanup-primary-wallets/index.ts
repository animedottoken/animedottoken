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

    console.log('cleanup-primary-wallets request:', { user_id: user.id });

    // Delete all primary wallets for this user directly
    const { error: cleanupError } = await supabaseClient
      .from('user_wallets')
      .delete()
      .eq('user_id', user.id)
      .eq('wallet_type', 'primary');

    if (cleanupError) {
      console.error('Database cleanup error:', cleanupError);
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup primary wallets' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('cleanup-primary-wallets success:', { user_id: user.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Primary wallets cleaned up successfully'
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('cleanup-primary-wallets error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});