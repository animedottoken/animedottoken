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

    const userWallet = user.user_metadata?.wallet_address;
    if (!userWallet) {
      return new Response(JSON.stringify({ error: "No wallet address found in user metadata" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { wallet_address, transaction_signature } = await req.json();

    // Verify the wallet address matches authenticated user
    if (wallet_address !== userWallet) {
      return new Response(JSON.stringify({ error: "Wallet address mismatch" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    if (!wallet_address || !transaction_signature) {
      return new Response(JSON.stringify({ error: "Wallet address and transaction signature are required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // In production, you would verify the transaction signature here
    // For this demo, we'll assume the transaction is valid
    console.log(`Processing PFP unlock for wallet: ${wallet_address}, tx: ${transaction_signature}`);

    // Update the profile to unlock PFP feature
    const { error } = await supabase
      .from("user_profiles")
      .upsert({ 
        wallet_address, 
        pfp_unlock_status: true,
        updated_at: new Date().toISOString()
      }, { onConflict: "wallet_address" });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, pfp_unlocked: true }), {
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