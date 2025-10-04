import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address } = await req.json();
    console.log('get-profile request:', { wallet_address });

    // Get user from JWT (Web2 identity)
    const authHeader = req.headers.get('authorization');
    let userId = null;
    let currentUserWallet = null;
    
    if (authHeader) {
      const jwt = authHeader.replace('Bearer ', '');
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        {
          global: { headers: { Authorization: authHeader } },
        }
      );
      
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (!authError && user) {
        userId = user.id;
        // Extract wallet from JWT payload if available
        try {
          const payload = JSON.parse(atob(jwt.split('.')[1]));
          currentUserWallet = payload.wallet_address;
        } catch (e) {
          // JWT parsing failed, continue without wallet
        }
      }
    }

    // For security: require authentication for any profile access
    if (!userId) {
      console.log('get-profile error: Authentication required');
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Query by user_id first (Web2), then by wallet_address (Web3 fallback)
    let query = supabase
      .from("user_profiles")
      .select(`
        id,
        user_id,
        wallet_address,
        nickname,
        bio,
        profile_image_url,
        banner_image_url,
        profile_rank,
        trade_count,
        pfp_unlock_status,
        current_pfp_nft_mint_address,
        nft_count,
        collection_count,
        bio_unlock_status,
        created_at,
        updated_at
      `);

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("wallet_address", wallet_address);
    }

    const { data: profile, error } = await query.single();

    console.log('get-profile query result:', { profile, error });

    if (error && error.code !== 'PGRST116') {
      console.log('get-profile database error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Create default profile if doesn't exist
    if (!profile) {
      const defaultProfile = {
        id: userId ? crypto.randomUUID() : null,
        user_id: userId,
        wallet_address: wallet_address || currentUserWallet || null,
        nickname: null,
        bio: null,
        profile_image_url: null,
        banner_image_url: null,
        trade_count: 0,
        profile_rank: 'DEFAULT',
        pfp_unlock_status: false,
        bio_unlock_status: false,
        current_pfp_nft_mint_address: null,
        nft_count: 0,
        collection_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('get-profile returning default profile:', defaultProfile);
      return new Response(JSON.stringify(defaultProfile), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Determine if this is the user's own profile
    const isOwnProfile = (profile.user_id === userId) || 
                        (profile.wallet_address === currentUserWallet) ||
                        (wallet_address === currentUserWallet);

    // For security: return limited data for other users' profiles
    if (!isOwnProfile) {
      const publicProfile = {
        id: profile.id,
        user_id: profile.user_id,
        // SECURITY: wallet_address completely excluded for non-owners
        nickname: profile.nickname,
        profile_image_url: profile.profile_image_url,
        profile_rank: profile.profile_rank,
        trade_count: profile.trade_count,
        nft_count: profile.nft_count,
        collection_count: profile.collection_count,
        created_at: profile.created_at,
        // Hide sensitive fields
        bio: null,
        banner_image_url: null,
        pfp_unlock_status: false,
        current_pfp_nft_mint_address: null,
        bio_unlock_status: false,
        updated_at: profile.updated_at
      };
      
      console.log('get-profile returning public profile for other user:', publicProfile);
      return new Response(JSON.stringify(publicProfile), {
        status: 200,
        headers: corsHeaders,
      });
    }

    console.log('get-profile returning full profile for own user:', profile);
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('get-profile unexpected error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});