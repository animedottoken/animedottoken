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

    // Get user profiles to map user_id to wallet_address for NFT/collection stats
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, wallet_address')
      .in('id', user_ids);

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profiles' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create mapping of user_id to wallet_address
    const userWalletMap = userProfiles?.reduce((acc, profile) => {
      if (profile.wallet_address) {
        acc[profile.id] = profile.wallet_address;
      }
      return acc;
    }, {} as Record<string, string>) || {};

    // Get follower counts (user_id based)
    const { data: followCounts, error: followError } = await supabase
      .from('creator_follows')
      .select('user_id')
      .in('user_id', user_ids.filter(id => userWalletMap[id])); // Only count users with wallets as creators

    if (followError) {
      console.error('❌ Error fetching follow counts:', followError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch follow counts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Count followers by user_id
    const followerCounts = followCounts?.reduce((acc: Record<string, number>, follow) => {
      if (follow.user_id) {
        acc[follow.user_id] = (acc[follow.user_id] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    // Get NFT like counts (wallet-based since NFTs are linked to wallet addresses)
    const walletAddresses = Object.values(userWalletMap);
    const { data: nftLikes, error: nftLikesError } = await supabase
      .from('nft_likes')
      .select(`
        id,
        nfts!inner(creator_address)
      `)
      .in('nfts.creator_address', walletAddresses);

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

    // Count NFT likes by creator wallet, then map back to user_id
    const nftLikeCounts = nftLikes?.reduce((acc: Record<string, number>, like: any) => {
      const creatorWallet = like.nfts?.creator_address;
      if (creatorWallet) {
        acc[creatorWallet] = (acc[creatorWallet] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    // Get collection like counts (wallet-based since collections are linked to wallet addresses)
    const { data: collectionLikes, error: collectionLikesError } = await supabase
      .from('collection_likes')
      .select(`
        id,
        collections!inner(creator_address)
      `)
      .in('collections.creator_address', walletAddresses);

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

    // Count collection likes by creator wallet, then map back to user_id
    const collectionLikeCounts = collectionLikes?.reduce((acc: Record<string, number>, like: any) => {
      const creatorWallet = like.collections?.creator_address;
      if (creatorWallet) {
        acc[creatorWallet] = (acc[creatorWallet] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    // Aggregate stats by user_id
    const stats = user_ids.map(userId => {
      const walletAddress = userWalletMap[userId];
      const nftLikesCount = walletAddress ? (nftLikeCounts[walletAddress] || 0) : 0;
      const collectionLikesCount = walletAddress ? (collectionLikeCounts[walletAddress] || 0) : 0;
      
      return {
        user_id: userId,
        follower_count: followerCounts[userId] || 0,
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