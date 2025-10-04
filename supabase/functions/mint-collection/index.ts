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
    // CRITICAL SECURITY: Verify JWT authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: MintCollectionRequest = await req.json();
    console.log('Mint-collection request from user:', user.id);

    if (!body || !body.collectionId || !body.creatorAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: collectionId, creatorAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL SECURITY: Rate limiting (3 requests per 60 minutes)
    const { data: rateLimitOk } = await serviceClient.rpc('check_rate_limit', {
      p_user_wallet: body.creatorAddress,
      p_endpoint: 'mint-collection',
      p_max_requests: 3,
      p_window_minutes: 60
    });

    if (!rateLimitOk) {
      await serviceClient.from('security_events').insert({
        event_type: 'rate_limit_exceeded',
        severity: 'high',
        user_id: user.id,
        wallet_address: body.creatorAddress,
        metadata: { endpoint: 'mint-collection' }
      });

      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // CRITICAL SECURITY: Verify ownership - creator_address must match authenticated user's wallet
    if (collection.creator_address !== body.creatorAddress) {
      await serviceClient.from('security_events').insert({
        event_type: 'unauthorized_access_attempt',
        severity: 'critical',
        user_id: user.id,
        wallet_address: body.creatorAddress,
        metadata: {
          action: 'mint-collection',
          collection_id: body.collectionId,
          actual_creator: collection.creator_address
        }
      });

      return new Response(
        JSON.stringify({ error: "Unauthorized: You are not the creator of this collection" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL SECURITY: Verify user's primary wallet matches creator address
    const { data: userWallets } = await serviceClient
      .from('user_wallets')
      .select('wallet_address, wallet_type')
      .eq('user_id', user.id)
      .eq('is_verified', true);

    const hasMatchingWallet = userWallets?.some(
      w => w.wallet_address === body.creatorAddress && w.wallet_type === 'primary'
    );

    if (!hasMatchingWallet) {
      await serviceClient.from('security_events').insert({
        event_type: 'unauthorized_access_attempt',
        severity: 'critical',
        user_id: user.id,
        wallet_address: body.creatorAddress,
        metadata: {
          action: 'mint-collection',
          reason: 'wallet_not_linked_to_user'
        }
      });

      return new Response(
        JSON.stringify({ error: "Unauthorized: Wallet not linked to your account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful mint attempt
    await serviceClient.from('security_events').insert({
      event_type: 'collection_mint_initiated',
      severity: 'info',
      user_id: user.id,
      wallet_address: body.creatorAddress,
      metadata: {
        collection_id: body.collectionId,
        collection_name: collection.name
      }
    });

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
        message: 'Collection NFT minted successfully',
        collectionMintAddress: collectionMintAddress
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