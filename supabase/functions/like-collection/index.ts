
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
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Verify JWT with anon key client
    const jwt = authHeader.substring(7);
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: userError } = await authClient.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid JWT token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify the user wallet matches the authenticated user's wallet
    const userWalletFromAuth = user.user_metadata?.wallet_address;
    if (userWalletFromAuth !== user_wallet) {
      return new Response(JSON.stringify({ error: "Wallet address mismatch" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Use service role for database operations (now that auth is verified)
    const supabase = createClient(supabaseUrl, serviceKey);

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
