import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { follower_wallet } = await req.json();

    if (!follower_wallet) {
      return new Response(
        JSON.stringify({ error: 'follower_wallet is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔍 Getting followed creators for wallet:', follower_wallet);

    const { data, error } = await supabase
      .from('creator_follows')
      .select('creator_wallet')
      .eq('follower_wallet', follower_wallet);

    if (error) {
      console.error('❌ Error fetching followed creators:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch followed creators' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const creators = data?.map(f => f.creator_wallet) || [];
    console.log('✅ Found followed creators:', creators.length);

    return new Response(
      JSON.stringify({ success: true, creators }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in get-followed-creators:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});