import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateMintJobRequest {
  collectionId: string;
  quantity: number;
  walletAddress: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for user authentication
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Create Supabase client with service role for database operations
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { collectionId, quantity, walletAddress }: CreateMintJobRequest = await req.json();

    // Validate input
    if (!collectionId || !quantity || !walletAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: collectionId, quantity, walletAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (quantity < 1 || quantity > 1000) {
      return new Response(
        JSON.stringify({ error: "Quantity must be between 1 and 1000" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify collection exists and is active
    const { data: collection, error: collectionError } = await serviceClient
      .from("collections")
      .select("id, name, mint_price, max_supply, items_redeemed, is_live, is_active")
      .eq("id", collectionId)
      .single();

    if (collectionError || !collection) {
      console.error("Collection error:", collectionError);
      return new Response(
        JSON.stringify({ error: "Collection not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!collection.is_live || !collection.is_active) {
      return new Response(
        JSON.stringify({ error: "Collection is not available for minting" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if enough supply remains
    const remainingSupply = collection.max_supply - collection.items_redeemed;
    if (quantity > remainingSupply) {
      return new Response(
        JSON.stringify({ 
          error: `Only ${remainingSupply} NFTs remaining in collection`,
          remainingSupply 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total cost
    const totalCost = collection.mint_price * quantity;

    // Create mint job
    const { data: mintJob, error: jobError } = await serviceClient
      .from("mint_jobs")
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        collection_id: collectionId,
        total_quantity: quantity,
        total_cost: totalCost,
        status: "pending"
      })
      .select()
      .single();

    if (jobError) {
      console.error("Job creation error:", jobError);
      return new Response(
        JSON.stringify({ error: "Failed to create mint job" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create individual job items (5 NFTs per batch for optimal processing)
    const batchSize = 5;
    const totalBatches = Math.ceil(quantity / batchSize);
    const jobItems = [];

    for (let batch = 0; batch < totalBatches; batch++) {
      const itemsInBatch = Math.min(batchSize, quantity - (batch * batchSize));
      
      for (let item = 0; item < itemsInBatch; item++) {
        jobItems.push({
          mint_job_id: mintJob.id,
          batch_number: batch + 1,
          status: "pending"
        });
      }
    }

    const { error: itemsError } = await serviceClient
      .from("mint_job_items")
      .insert(jobItems);

    if (itemsError) {
      console.error("Job items creation error:", itemsError);
      // Clean up the job if items creation failed
      await serviceClient.from("mint_jobs").delete().eq("id", mintJob.id);
      
      return new Response(
        JSON.stringify({ error: "Failed to create job items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created mint job ${mintJob.id} for ${quantity} NFTs in ${totalBatches} batches`);

    // Return success response with job details
    return new Response(
      JSON.stringify({
        success: true,
        jobId: mintJob.id,
        totalQuantity: quantity,
        totalBatches,
        totalCost,
        collectionName: collection.name,
        estimatedTime: `${Math.ceil(totalBatches * 2)} minutes` // Rough estimate
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});