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
    const { nickname, wallet_address, transaction_signature } = await req.json();

    // Validate nickname format
    if (!nickname || typeof nickname !== "string") {
      return new Response(JSON.stringify({ error: "Nickname is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (nickname.length < 3 || nickname.length > 15) {
      return new Response(JSON.stringify({ error: "Nickname must be 3-15 characters long" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!/^[a-zA-Z0-9]+$/.test(nickname)) {
      return new Response(JSON.stringify({ error: "Nickname can only contain alphanumeric characters" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!wallet_address) {
      return new Response(JSON.stringify({ error: "Wallet address is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!transaction_signature) {
      return new Response(JSON.stringify({ error: "Transaction signature is required for payment verification" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // In production, verify the transaction signature here
    console.log(`Processing nickname change for wallet: ${wallet_address}, tx: ${transaction_signature}`);

    // Check if nickname already exists
    const { data: existingNickname } = await supabase
      .from("user_profiles")
      .select("wallet_address")
      .eq("nickname", nickname)
      .single();

    if (existingNickname && existingNickname.wallet_address !== wallet_address) {
      return new Response(JSON.stringify({ error: "Nickname already taken" }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    // Get existing user profile data for preserving other fields
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("wallet_address", wallet_address)
      .single();

    // Upsert the nickname while preserving other fields
    const { error } = await supabase
      .from("user_profiles")
      .upsert({ 
        wallet_address, 
        nickname,
        trade_count: userProfile?.trade_count || 0,
        profile_rank: userProfile?.profile_rank || 'DEFAULT',
        pfp_unlock_status: userProfile?.pfp_unlock_status || false,
        current_pfp_nft_mint_address: userProfile?.current_pfp_nft_mint_address || null,
        profile_image_url: userProfile?.profile_image_url || null
      }, { onConflict: "wallet_address" });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, nickname }), {
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