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

    const { wallet_addresses } = await req.json();

    if (!wallet_addresses || !Array.isArray(wallet_addresses)) {
      return new Response(
        JSON.stringify({ error: 'wallet_addresses array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔍 Getting creator stats for wallets:', wallet_addresses);

    // Get follower counts
    const { data: followStats, error: followError } = await supabase
      .from('creator_follows')
      .select('creator_wallet')
      .in('creator_wallet', wallet_addresses);

    if (followError) {
      console.error('❌ Error fetching follow stats:', followError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch follow stats' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get NFT like counts
    const { data: nftLikeStats, error: nftLikeError } = await supabase
      .from('nft_likes')
      .select('nft_id, nfts!inner(creator_address)')
      .in('nfts.creator_address', wallet_addresses);

    if (nftLikeError) {
      console.error('❌ Error fetching NFT like stats:', nftLikeError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch NFT like stats' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get collection like counts
    const { data: collectionLikeStats, error: collectionLikeError } = await supabase
      .from('collection_likes')
      .select('collection_id, collections!inner(creator_address)')
      .in('collections.creator_address', wallet_addresses);

    if (collectionLikeError) {
      console.error('❌ Error fetching collection like stats:', collectionLikeError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch collection like stats' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process the data
    const stats = wallet_addresses.map(wallet => {
      const followerCount = followStats?.filter(f => f.creator_wallet === wallet).length || 0;
      const nftLikesCount = nftLikeStats?.filter(l => (l.nfts as any)?.creator_address === wallet).length || 0;
      const collectionLikesCount = collectionLikeStats?.filter(l => (l.collections as any)?.creator_address === wallet).length || 0;
      
      return {
        wallet_address: wallet,
        follower_count: followerCount,
        nft_likes_count: nftLikesCount,
        collection_likes_count: collectionLikesCount,
        total_likes_count: nftLikesCount + collectionLikesCount
      };
    });

    console.log('✅ Retrieved creator stats:', stats.length);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in get-creator-stats:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});