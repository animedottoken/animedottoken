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

    console.log(`Processing nickname change for wallet: ${wallet_address}, tx: ${transaction_signature}`);

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

    if (existingNickname && existingNickname.wallet_address !== wallet_address) {
      return new Response(JSON.stringify({ error: "Nickname already taken" }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    // Get existing user profile data for preserving other fields
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("wallet_address", wallet_address)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Database error fetching profile" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Upsert the nickname while preserving other fields
    const { error: updateError } = await supabase
      .from("user_profiles")
      .upsert({ 
        wallet_address, 
        nickname: trimmedNickname,
        trade_count: userProfile?.trade_count || 0,
        profile_rank: userProfile?.profile_rank || 'DEFAULT',
        pfp_unlock_status: userProfile?.pfp_unlock_status || false,
        bio_unlock_status: userProfile?.bio_unlock_status || false,
        current_pfp_nft_mint_address: userProfile?.current_pfp_nft_mint_address || null,
        profile_image_url: userProfile?.profile_image_url || null,
        banner_image_url: userProfile?.banner_image_url || null,
        bio: userProfile?.bio || null
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
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});