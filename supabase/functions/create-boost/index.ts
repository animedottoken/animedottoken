import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NODE_ENV === 'production' 
    ? "https://animedottoken.com" 
    : "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface CreateBoostRequest {
  nftId: string;
  bidAmount: number;
  tokenMint: string;
  bidderWallet: string;
  txSignature: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreateBoostRequest = await req.json();
    const { nftId, bidAmount, tokenMint, bidderWallet, txSignature } = body;

    // Verify the bidder wallet matches authenticated user
    if (bidderWallet !== userWallet) {
      return new Response(JSON.stringify({ error: "Bidder wallet address mismatch" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    if (!nftId || !bidAmount || !tokenMint || !bidderWallet || !txSignature) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify NFT ownership
    const { data: nft, error: nftError } = await supabase
      .from('nfts')
      .select('id, owner_address')
      .eq('id', nftId)
      .maybeSingle();

    if (nftError) {
      console.error('NFT fetch error:', nftError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify NFT' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!nft) {
      return new Response(
        JSON.stringify({ success: false, error: 'NFT not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (nft.owner_address !== bidderWallet) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only the NFT owner can boost this item' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing active boost for this NFT to avoid RLS trigger error
    const { data: existing, error: existingErr } = await supabase
      .from('boosted_listings')
      .select('id, end_time')
      .eq('nft_id', nftId)
      .eq('is_active', true)
      .maybeSingle();

    if (existingErr) {
      console.error('Existing boost check error:', existingErr);
    }

    if (existing) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `An active boost already exists for this NFT${existing.end_time ? ` (ends at ${existing.end_time})` : ''}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert boost using service role
    const { data: boost, error: insertError } = await supabaseService
      .from('boosted_listings')
      .insert({
        nft_id: nftId,
        bid_amount: bidAmount,
        token_mint: tokenMint,
        bidder_wallet: bidderWallet,
        tx_signature: txSignature,
        is_active: true,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Boost insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: boost }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Unhandled error in create-boost:', e);
    return new Response(
      JSON.stringify({ success: false, error: 'Unexpected error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
