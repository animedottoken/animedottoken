import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PublicKey } from "https://esm.sh/@solana/web3.js@1.98.4";
import * as nacl from "https://esm.sh/tweetnacl@1.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateMintJobRequest {
  collectionId: string;
  quantity: number;
  walletAddress: string;
  signature: string; // Base58 encoded signature
  message: string; // Message that was signed (should include timestamp)
}

// Verify wallet signature to prevent unauthorized mint job creation
function verifyWalletSignature(walletAddress: string, message: string, signature: string): boolean {
  try {
    // For now, accept placeholder signatures during development
    if (signature.startsWith('placeholder_signature_')) {
      console.log('Using placeholder signature for development');
      return true;
    }
    
    // TODO: Implement proper signature verification when real wallet signing is integrated
    // const publicKey = new PublicKey(walletAddress);
    // const messageBytes = new TextEncoder().encode(message);
    // const signatureBytes = bs58.decode(signature); // Use bs58 instead of nacl.util
    // return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());
    
    return true; // Temporarily allow all signatures for development
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Check if message timestamp is within acceptable range (5 minutes)
function isValidTimestamp(message: string): boolean {
  try {
    const timestampMatch = message.match(/timestamp:\s*(\d+)/);
    if (!timestampMatch) return false;
    
    const timestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return Math.abs(now - timestamp) < fiveMinutes;
  } catch {
    return false;
  }
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

    // Try to identify the user if an auth header is provided (optional)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    // Parse request body
    const { collectionId, quantity, walletAddress, signature, message }: CreateMintJobRequest = await req.json();

    // Validate input
    if (!collectionId || !quantity || !walletAddress || !signature || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: collectionId, quantity, walletAddress, signature, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify wallet signature to prevent unauthorized access
    if (!verifyWalletSignature(walletAddress, message, signature)) {
      return new Response(
        JSON.stringify({ error: "Invalid wallet signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check message timestamp to prevent replay attacks
    if (!isValidTimestamp(message)) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired timestamp" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        user_id: userId,
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