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
      }
    }

    // Require either wallet_address or authenticated user
    if (!wallet_address && !userId) {
      console.log('get-profile error: Missing wallet address and no authenticated user');
      return new Response(JSON.stringify({ error: "Wallet address or authentication is required" }), {
        status: 400,
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
        id: userId ? crypto.randomUUID() : null, // Generate a UUID for the default profile
        user_id: userId,
        wallet_address: wallet_address || null,
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

    console.log('get-profile returning existing profile:', profile);
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