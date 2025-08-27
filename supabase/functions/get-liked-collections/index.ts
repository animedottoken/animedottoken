import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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
    const { user_wallet } = await req.json();

    if (!user_wallet) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing user_wallet', 
          code: 'LKC400',
          message: 'Wallet address is required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error', 
          code: 'LKC500',
          message: 'Server is temporarily unavailable' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Fetching liked collections for wallet: ${user_wallet}`);

    const { data, error } = await supabase
      .from('collection_likes')
      .select('collection_id')
      .eq('user_wallet', user_wallet);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database error', 
          code: 'LKC500',
          message: 'Failed to fetch liked collections' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const likedCollectionIds = data?.map(l => l.collection_id) || [];
    console.log(`Found ${likedCollectionIds.length} liked collections for wallet: ${user_wallet}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        liked_collection_ids: likedCollectionIds,
        code: 'LKC200' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error', 
        code: 'LKC500',
        message: 'Something went wrong. Please try again.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});