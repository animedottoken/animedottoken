
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { collection_id, user_wallet, action } = await req.json();

    console.log('Collection like request:', { collection_id, user_wallet, action });

    // Validate required fields
    if (!collection_id || !user_wallet || !action) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: collection_id, user_wallet, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action
    if (!['like', 'unlike'].includes(action)) {
      console.error('Invalid action:', action);
      return new Response(
        JSON.stringify({ error: 'Action must be "like" or "unlike"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that collection exists
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collection_id)
      .single();

    if (collectionError || !collection) {
      console.error('Collection not found:', collectionError);
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'like') {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('collection_likes')
        .select('id')
        .eq('collection_id', collection_id)
        .eq('user_wallet', user_wallet)
        .single();

      if (existingLike) {
        console.log('Collection already liked');
        return new Response(
          JSON.stringify({ error: 'Collection already liked' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert like
      const { error: insertError } = await supabase
        .from('collection_likes')
        .insert({ collection_id, user_wallet });

      if (insertError) {
        console.error('Error inserting collection like:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to like collection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Collection liked successfully');
      return new Response(
        JSON.stringify({ success: true, action: 'liked' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else { // unlike
      const { error: deleteError } = await supabase
        .from('collection_likes')
        .delete()
        .eq('collection_id', collection_id)
        .eq('user_wallet', user_wallet);

      if (deleteError) {
        console.error('Error unliking collection:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to unlike collection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Collection unliked successfully');
      return new Response(
        JSON.stringify({ success: true, action: 'unliked' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error in like-collection function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
