import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nft_mint_address, wallet_address } = await req.json();

    if (!nft_mint_address || !wallet_address) {
      return new Response(JSON.stringify({ error: "NFT mint address and wallet address are required" }), {
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

    // Verify user has unlocked PFP feature
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("pfp_unlock_status")
      .eq("wallet_address", wallet_address)
      .single();

    if (!profile?.pfp_unlock_status) {
      return new Response(JSON.stringify({ error: "PFP feature not unlocked. Please unlock first by paying 1,000 $ANIME." }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Verify user owns the NFT
    const { data: nft } = await supabase
      .from("nfts")
      .select("owner_address, image_url")
      .eq("mint_address", nft_mint_address)
      .single();

    if (!nft || nft.owner_address !== wallet_address) {
      return new Response(JSON.stringify({ error: "You don't own this NFT or it doesn't exist" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Update the profile with the new PFP
    const { error } = await supabase
      .from("user_profiles")
      .update({ 
        current_pfp_nft_mint_address: nft_mint_address,
        profile_image_url: nft.image_url,
        updated_at: new Date().toISOString()
      })
      .eq("wallet_address", wallet_address);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      nft_mint_address,
      profile_image_url: nft.image_url
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