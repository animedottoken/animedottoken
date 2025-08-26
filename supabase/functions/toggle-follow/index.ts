
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NODE_ENV === 'production' 
    ? "https://*.lovable.app" 
    : "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { creator_wallet, follower_wallet, action } = await req.json();

    if (!creator_wallet || !follower_wallet || !action) {
      return new Response(JSON.stringify({ error: "creator_wallet, follower_wallet, and action are required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!['follow', 'unfollow'].includes(action)) {
      return new Response(JSON.stringify({ error: "action must be 'follow' or 'unfollow'" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Verify JWT with anon key client
    const jwt = authHeader.substring(7);
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: userError } = await authClient.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid JWT token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify the follower wallet matches the authenticated user's wallet
    const userWallet = user.user_metadata?.wallet_address;
    if (userWallet !== follower_wallet) {
      return new Response(JSON.stringify({ error: "Follower wallet address mismatch" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Use service role for the actual operation (now that auth is verified)
    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === 'follow') {
      const { error } = await supabase
        .from("creator_follows")
        .insert({ 
          creator_wallet, 
          follower_wallet,
          created_at: new Date().toISOString()
        });

      if (error) {
        // Check if already following
        if (error.code === '23505') {
          return new Response(JSON.stringify({ error: "Already following this creator" }), {
            status: 409,
            headers: corsHeaders,
          });
        }
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("creator_follows")
        .delete()
        .eq("creator_wallet", creator_wallet)
        .eq("follower_wallet", follower_wallet);

      if (error) {
        throw error;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      creator_wallet,
      follower_wallet
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
