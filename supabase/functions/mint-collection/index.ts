import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MintCollectionRequest {
  collectionId: string;
  creatorAddress: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: MintCollectionRequest = await req.json();
    console.log('Mint-collection request body:', body);

    if (!body || !body.collectionId || !body.creatorAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: collectionId, creatorAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get collection details
    const { data: collection, error: collectionError } = await serviceClient
      .from('collections')
      .select('*')
      .eq('id', body.collectionId)
      .single();

    if (collectionError || !collection) {
      console.error('Collection fetch error:', collectionError);
      return new Response(
        JSON.stringify({ error: "Collection not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simulate Collection NFT minting on Solana (using Metaplex)
    // In a real implementation, this would use @metaplex-foundation/js to create a Collection NFT
    console.log(`Minting Collection NFT for collection: ${collection.name}`);
    
    // For now, simulate the minting process with a mock mint address
    const collectionMintAddress = `${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`;
    
    // Simulate processing time (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Update collection with mint address and verification status
    const { error: updateError } = await serviceClient
      .from('collections')
      .update({
        collection_mint_address: collectionMintAddress,
        verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.collectionId);

    if (updateError) {
      console.error('Collection update error:', updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update collection with mint address" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully minted Collection NFT: ${collectionMintAddress}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        collectionMintAddress,
        message: "Collection NFT minted successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected error minting collection' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});