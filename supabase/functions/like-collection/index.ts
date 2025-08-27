
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://*.lovable.app' 
    : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { collection_id, user_wallet, action } = await req.json();

    console.log('Collection like request:', { collection_id, user_wallet, action });

    // Validate required fields
    if (!collection_id || !user_wallet || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: collection_id, user_wallet, action' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate action
    if (!['like', 'unlike'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Action must be "like" or "unlike"' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate that collection exists
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collection_id)
      .maybeSingle();

    if (collectionError || !collection) {
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (action === 'like') {
      // Try to insert; unique constraint will enforce one like per user per collection
      const { error: insertError } = await supabase
        .from('collection_likes')
        .insert({ collection_id, user_wallet });

      if (insertError) {
        if ((insertError as any).code === '23505') {
          return new Response(
            JSON.stringify({ error: 'Collection already liked' }),
            { status: 409, headers: corsHeaders }
          );
        }
        return new Response(
          JSON.stringify({ error: insertError.message || 'Failed to like collection' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log('Collection liked successfully');
      return new Response(
        JSON.stringify({ success: true, action: 'liked', collection_id, user_wallet }),
        { status: 200, headers: corsHeaders }
      );

    } else { // unlike
      const { error: deleteError } = await supabase
        .from('collection_likes')
        .delete()
        .eq('collection_id', collection_id)
        .eq('user_wallet', user_wallet);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message || 'Failed to unlike collection' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log('Collection unliked successfully');
      return new Response(
        JSON.stringify({ success: true, action: 'unliked', collection_id, user_wallet }),
        { status: 200, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Unexpected error in like-collection function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
