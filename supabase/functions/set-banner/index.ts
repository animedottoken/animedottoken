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
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
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

    // Get wallet address from authenticated user's metadata
    const userWallet = user.user_metadata?.wallet_address;
    if (!userWallet) {
      return new Response(JSON.stringify({ error: "No wallet address found in user metadata" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { banner_url, transaction_signature } = await req.json();

    if (!banner_url) {
      return new Response(JSON.stringify({ error: "banner_url is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate URL format
    try {
      new URL(banner_url);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid banner URL format" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Rate limiting check
    const supabase = createClient(supabaseUrl, serviceKey);
    const rateLimitCheck = await supabase.rpc('check_rate_limit', {
      p_user_wallet: userWallet,
      p_endpoint: 'set-banner',
      p_max_requests: 10,
      p_window_minutes: 1
    });

    if (rateLimitCheck.error || !rateLimitCheck.data) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: corsHeaders,
      });
    }

    console.log('Setting banner for wallet:', userWallet, 'URL:', banner_url);

    // Update the user profile with the new banner using regular client with RLS
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data, error } = await userClient
      .from('user_profiles')
      .upsert({
        wallet_address: userWallet,
        banner_image_url: banner_url,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'wallet_address'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Failed to update banner in database' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log('Banner updated successfully for:', userWallet);

    return new Response(JSON.stringify({ success: true, profile: data }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error in set-banner function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});