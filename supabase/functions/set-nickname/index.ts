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

    const { nickname, transaction_signature } = await req.json();

    // Validate nickname
    if (!nickname || typeof nickname !== "string") {
      return new Response(JSON.stringify({ error: "Nickname is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      return new Response(JSON.stringify({ error: "Nickname must be 2-20 characters long" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Allow letters, numbers, spaces, and common special characters
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(trimmedNickname)) {
      return new Response(JSON.stringify({ error: "Nickname can only contain letters, numbers, spaces, hyphens, underscores, and periods" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Verify transaction signature (required for nickname changes)
    if (!transaction_signature) {
      return new Response(JSON.stringify({ error: "Transaction signature is required for payment verification" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // In production, verify the actual Solana transaction here
    // For now, we accept test signatures
    if (!transaction_signature.startsWith('test_tx_') && !transaction_signature.startsWith('simulated_')) {
      return new Response(JSON.stringify({ error: 'Invalid transaction signature' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Rate limiting check
    const supabase = createClient(supabaseUrl, serviceKey);
    const rateLimitCheck = await supabase.rpc('check_rate_limit', {
      p_user_wallet: userWallet,
      p_endpoint: 'set-nickname',
      p_max_requests: 3,
      p_window_minutes: 1
    });

    if (rateLimitCheck.error || !rateLimitCheck.data) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: corsHeaders,
      });
    }

    console.log(`Processing nickname change for wallet: ${userWallet}, tx: ${transaction_signature}`);

    // Check if nickname already exists
    const { data: existingNickname, error: existingError } = await supabase
      .from("user_profiles")
      .select("wallet_address")
      .eq("nickname", trimmedNickname)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing nickname:", existingError);
      return new Response(JSON.stringify({ error: "Database error checking nickname availability" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (existingNickname && existingNickname.wallet_address !== userWallet) {
      return new Response(JSON.stringify({ error: "Nickname already taken" }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    // Update nickname using regular client with RLS
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { error: updateError } = await userClient
      .from("user_profiles")
      .upsert({ 
        wallet_address: userWallet, 
        nickname: trimmedNickname,
        updated_at: new Date().toISOString(),
      }, { onConflict: "wallet_address" });

    if (updateError) {
      console.error("Error updating nickname:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, nickname: trimmedNickname }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('Error in set-nickname function:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});