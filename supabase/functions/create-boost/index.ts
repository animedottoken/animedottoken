import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, anonKey);
    const supabaseService = createClient(supabaseUrl, serviceKey);

    const body: CreateBoostRequest = await req.json();
    const { nftId, bidAmount, tokenMint, bidderWallet, txSignature } = body;

    if (!nftId || !bidAmount || !tokenMint || !bidderWallet || !txSignature) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!nft) {
      return new Response(
        JSON.stringify({ success: false, error: 'NFT not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (nft.owner_address !== bidderWallet) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only the NFT owner can boost this item' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
