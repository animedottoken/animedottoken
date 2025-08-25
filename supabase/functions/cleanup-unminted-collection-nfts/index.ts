import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupRequest {
  collection_id: string;
  action: 'detach' | 'delete';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { collection_id, action }: CleanupRequest = await req.json();

    if (!collection_id || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing collection_id or action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['detach', 'delete'].includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action must be "detach" or "delete"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting ${action} operation for collection ${collection_id}`);

    // Get collection details to verify it's unminted and check ownership
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collection_id)
      .single();

    if (collectionError) {
      console.error('Collection query error:', collectionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Collection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify collection is unminted (no collection_mint_address)
    if (collection.collection_mint_address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Collection is already minted on-chain. Cannot cleanup NFTs from minted collections.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all NFTs in this collection
    const { data: nfts, error: nftsError } = await supabase
      .from('nfts')
      .select('*')
      .eq('collection_id', collection_id);

    if (nftsError) {
      console.error('NFTs query error:', nftsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch NFTs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!nfts || nfts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No NFTs found in collection',
          processed: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${nfts.length} NFTs to ${action}`);

    let processed = 0;
    let errors: string[] = [];

    if (action === 'detach') {
      // Detach NFTs by setting collection_id to null (making them standalone)
      for (const nft of nfts) {
        try {
          const { error: updateError } = await supabase
            .from('nfts')
            .update({ 
              collection_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', nft.id);

          if (updateError) {
            console.error(`Failed to detach NFT ${nft.id}:`, updateError);
            errors.push(`Failed to detach NFT ${nft.name}: ${updateError.message}`);
          } else {
            processed++;
            console.log(`Detached NFT ${nft.id} (${nft.name})`);
          }
        } catch (err) {
          console.error(`Error detaching NFT ${nft.id}:`, err);
          errors.push(`Failed to detach NFT ${nft.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    } else if (action === 'delete') {
      // Delete NFTs completely
      for (const nft of nfts) {
        try {
          const { error: deleteError } = await supabase
            .from('nfts')
            .delete()
            .eq('id', nft.id);

          if (deleteError) {
            console.error(`Failed to delete NFT ${nft.id}:`, deleteError);
            errors.push(`Failed to delete NFT ${nft.name}: ${deleteError.message}`);
          } else {
            processed++;
            console.log(`Deleted NFT ${nft.id} (${nft.name})`);
          }
        } catch (err) {
          console.error(`Error deleting NFT ${nft.id}:`, err);
          errors.push(`Failed to delete NFT ${nft.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }

    // Update collection supply counters
    try {
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          items_redeemed: Math.max(0, collection.items_redeemed - processed),
          items_available: (collection.items_available || 0) + processed,
          updated_at: new Date().toISOString()
        })
        .eq('id', collection_id);

      if (updateError) {
        console.error('Failed to update collection counters:', updateError);
        errors.push(`Failed to update collection counters: ${updateError.message}`);
      }
    } catch (err) {
      console.error('Error updating collection counters:', err);
      errors.push(`Failed to update collection counters: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    const result = {
      success: true,
      action,
      processed,
      total: nfts.length,
      errors: errors.length > 0 ? errors : undefined,
      message: action === 'detach' 
        ? `Successfully detached ${processed} NFTs to standalone. They can now be viewed independently.`
        : `Successfully deleted ${processed} NFTs from the collection.`
    };

    console.log('Cleanup completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Cleanup function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});