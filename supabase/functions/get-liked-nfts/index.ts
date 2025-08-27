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
          code: 'LKN400',
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
          code: 'LKN500',
          message: 'Server is temporarily unavailable' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Fetching liked NFTs for wallet: ${user_wallet}`);

    const { data, error } = await supabase
      .from('nft_likes')
      .select('nft_id')
      .eq('user_wallet', user_wallet);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database error', 
          code: 'LKN500',
          message: 'Failed to fetch liked NFTs' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const likedNftIds = data?.map(l => l.nft_id) || [];
    console.log(`Found ${likedNftIds.length} liked NFTs for wallet: ${user_wallet}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        liked_nft_ids: likedNftIds,
        code: 'LKN200' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error', 
        code: 'LKN500',
        message: 'Something went wrong. Please try again.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});