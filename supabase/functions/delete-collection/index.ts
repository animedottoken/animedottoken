import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteCollectionRequest {
  collection_id: string;
  wallet_address: string;
  signature: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { collection_id, wallet_address, signature }: DeleteCollectionRequest = await req.json();

    console.log('Delete collection request:', { collection_id, wallet_address });

    if (!collection_id || !wallet_address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: collection_id, wallet_address' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get collection details and verify ownership
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collection_id)
      .single();

    if (collectionError || !collection) {
      console.error('Collection not found:', collectionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Collection not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user owns the collection
    if (collection.creator_address !== wallet_address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You can only delete collections you created' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if collection has any minted NFTs
    const { data: nfts, error: nftsError } = await supabase
      .from('nfts')
      .select('id')
      .eq('collection_id', collection_id);

    if (nftsError) {
      console.error('Error checking NFTs:', nftsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error checking collection NFTs' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (nfts && nfts.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Cannot delete collection with ${nfts.length} minted NFTs. Burn all NFTs first.` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Delete related data first
    await supabase
      .from('collection_whitelist')
      .delete()
      .eq('collection_id', collection_id);

    await supabase
      .from('mint_jobs')
      .delete()
      .eq('collection_id', collection_id);

    // Delete the collection
    const { error: deleteError } = await supabase
      .from('collections')
      .delete()
      .eq('id', collection_id);

    if (deleteError) {
      console.error('Failed to delete collection:', deleteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to delete collection' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully deleted collection: ${collection_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Collection deleted successfully',
        deleted_collection: {
          id: collection.id,
          name: collection.name
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in delete-collection function:', error);
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