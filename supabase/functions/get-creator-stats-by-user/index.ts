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

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { user_ids } = await req.json();

    if (!user_ids || !Array.isArray(user_ids)) {
      return new Response(
        JSON.stringify({ error: 'user_ids array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔍 Getting creator stats for user_ids:', user_ids);

    // Get follower counts - count how many people follow each user (by user_id)
    const { data: followerData, error: followerError } = await supabase
      .from('creator_follows')
      .select('creator_user_id')
      .in('creator_user_id', user_ids);

    if (followerError) {
      console.error('❌ Error fetching follower counts:', followerError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch follower counts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Count followers by user_id
    const followerCountsByUserId = followerData?.reduce((acc: Record<string, number>, follow) => {
      if (follow.creator_user_id) {
        acc[follow.creator_user_id] = (acc[follow.creator_user_id] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    // Get following counts - count how many people each user follows
    const { data: followingData, error: followingError } = await supabase
      .from('creator_follows')
      .select('follower_user_id')
      .in('follower_user_id', user_ids);

    if (followingError) {
      console.error('❌ Error fetching following counts:', followingError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch following counts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Count following by user_id
    const followingCountsByUserId = followingData?.reduce((acc: Record<string, number>, follow) => {
      if (follow.follower_user_id) {
        acc[follow.follower_user_id] = (acc[follow.follower_user_id] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    // Get NFT like counts (user_id-based via creator_user_id)
    const { data: nftLikes, error: nftLikesError } = await supabase
      .from('nft_likes')
      .select(`
        id,
        nfts!inner(creator_user_id)
      `)
      .in('nfts.creator_user_id', user_ids);

    if (nftLikesError) {
      console.error('❌ Error fetching NFT likes:', nftLikesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch NFT likes' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Count NFT likes by creator user_id
    const nftLikeCounts = nftLikes?.reduce((acc: Record<string, number>, like: any) => {
      const creatorUserId = like.nfts?.creator_user_id;
      if (creatorUserId) {
        acc[creatorUserId] = (acc[creatorUserId] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    // Get collection like counts (user_id-based via creator_user_id)
    const { data: collectionLikes, error: collectionLikesError } = await supabase
      .from('collection_likes')
      .select(`
        id,
        collections!inner(creator_user_id)
      `)
      .in('collections.creator_user_id', user_ids);

    if (collectionLikesError) {
      console.error('❌ Error fetching collection likes:', collectionLikesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch collection likes' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Count collection likes by creator user_id
    const collectionLikeCounts = collectionLikes?.reduce((acc: Record<string, number>, like: any) => {
      const creatorUserId = like.collections?.creator_user_id;
      if (creatorUserId) {
        acc[creatorUserId] = (acc[creatorUserId] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    // Aggregate stats by user_id
    const stats = user_ids.map(userId => {
      const nftLikesCount = nftLikeCounts[userId] || 0;
      const collectionLikesCount = collectionLikeCounts[userId] || 0;
      
      return {
        user_id: userId,
        follower_count: followerCountsByUserId[userId] || 0,
        following_count: followingCountsByUserId[userId] || 0,
        nft_likes_count: nftLikesCount,
        collection_likes_count: collectionLikesCount,
        total_likes_count: nftLikesCount + collectionLikesCount
      };
    });

    console.log('✅ Creator stats calculated for', stats.length, 'users');

    return new Response(
      JSON.stringify({ success: true, stats }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in get-creator-stats-by-user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});