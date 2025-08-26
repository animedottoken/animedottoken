import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NODE_ENV === 'production' 
    ? "https://*.lovable.app" 
    : "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
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

    const { nft_mint_address, wallet_address, transaction_signature } = await req.json();

    if (!nft_mint_address || !wallet_address || !transaction_signature) {
      return new Response(JSON.stringify({ error: "NFT mint address, wallet address, and transaction signature are required" }), {
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

    // Verify the wallet address matches the authenticated user's wallet
    const userWallet = user.user_metadata?.wallet_address;
    if (userWallet !== wallet_address) {
      return new Response(JSON.stringify({ error: "Wallet address mismatch" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Use service role for database operations (now that auth is verified)
    const supabase = createClient(supabaseUrl, serviceKey);

    // In production, verify the transaction signature here
    console.log(`Processing PFP change for wallet: ${wallet_address}, tx: ${transaction_signature}`);

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