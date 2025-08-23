import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateMintJobRequest {
  collectionId: string;
  quantity: number;
  walletAddress: string;
  signature: string;
  message: string;
  nftDetails?: {
    name?: string;
    description?: string;
    attributes?: Array<{ trait_type: string; value: string; display_type?: string }>;
    imagePreview?: string;
  };
}

// Mock wallet signature verification (implement with real crypto libs in production)
const verifyWalletSignature = (walletAddress: string, message: string, signature: string): boolean => {
  // For now, accept any signature - in production this would verify the signature
  console.log(`Verifying signature for wallet ${walletAddress}`);
  return signature.startsWith('placeholder_signature') || signature.length > 10;
};

// Validate timestamp to prevent replay attacks
const isValidTimestamp = (message: string): boolean => {
  const timestampMatch = message.match(/timestamp:\s*(\d+)/);
  if (!timestampMatch) return false;
  
  const timestamp = parseInt(timestampMatch[1]);
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  return (now - timestamp) < fiveMinutes; // Allow 5 minutes window
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: CreateMintJobRequest = await req.json();
    const { collectionId, quantity, walletAddress, signature, message, nftDetails } = body;

    console.log(`Creating mint job for collection ${collectionId}, quantity: ${quantity}`);

    // Input validation
    if (!collectionId || !quantity || quantity <= 0 || !walletAddress || !signature || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate signature and timestamp
    if (!verifyWalletSignature(walletAddress, message, signature)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid wallet signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidTimestamp(message)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired timestamp' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get collection details and verify availability
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (collectionError) {
      console.error('Collection fetch error:', collectionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Collection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if collection is active and live
    if (!collection.is_active || !collection.is_live) {
      return new Response(
        JSON.stringify({ success: false, error: 'Collection is not active or live' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check availability
    if (collection.items_available < quantity) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient supply. Available: ${collection.items_available}, Requested: ${quantity}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate cost
    const totalCost = Number(collection.mint_price) * quantity;

    // Create mint job using service role for proper permissions
    const { data: job, error: jobError } = await supabaseService
      .from('mint_jobs')
      .insert({
        wallet_address: walletAddress,
        collection_id: collectionId,
        total_quantity: quantity,
        completed_quantity: 0,
        failed_quantity: 0,
        total_cost: totalCost,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create mint job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Created mint job ${job.id}`);

    // Create batch items for the job
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(quantity / BATCH_SIZE);
    const jobItems = [];

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const startIndex = batchNum * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, quantity);
      const batchQuantity = endIndex - startIndex;

      for (let i = 0; i < batchQuantity; i++) {
        jobItems.push({
          mint_job_id: job.id,
          batch_number: batchNum + 1,
          status: 'pending',
          retry_count: 0,
          max_retries: 3,
          metadata: {
            itemIndex: startIndex + i + 1,
            totalQuantity: quantity,
            nftDetails: nftDetails || null
          }
        });
      }
    }

    // Insert job items in batches to avoid payload limits
    const ITEM_INSERT_BATCH_SIZE = 100;
    for (let i = 0; i < jobItems.length; i += ITEM_INSERT_BATCH_SIZE) {
      const batch = jobItems.slice(i, i + ITEM_INSERT_BATCH_SIZE);
      const { error: itemsError } = await supabaseService
        .from('mint_job_items')
        .insert(batch);

      if (itemsError) {
        console.error('Job items creation error:', itemsError);
        // Clean up the job if items creation fails
        await supabaseService.from('mint_jobs').delete().eq('id', job.id);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create job items' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Created ${jobItems.length} job items for job ${job.id}`);

    // Estimate processing time (rough estimate: 2-3 seconds per NFT)
    const estimatedMinutes = Math.ceil((quantity * 2.5) / 60);
    const estimatedTime = estimatedMinutes < 1 ? '< 1 minute' : `~${estimatedMinutes} minutes`;

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        totalQuantity: quantity,
        totalBatches,
        totalCost,
        collectionName: collection.name,
        estimatedTime
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-mint-job:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});