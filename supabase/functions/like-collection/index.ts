import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization required',
        code: 'LKC401',
        message: 'Please log in to like collections'
      }), { status: 200, headers: corsHeaders });
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Server configuration error',
        code: 'LKC500',
        message: 'Service is temporarily unavailable'
      }), { status: 200, headers: corsHeaders });
    }

    // Verify JWT and get user
    const supabaseClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid session',
        code: 'LKC401',
        message: 'Your session has expired. Please log in again.'
      }), { status: 200, headers: corsHeaders });
    }

    const { collection_id, action } = await req.json();

    console.log(`Collection like request: ${action} - Collection: ${collection_id}, User: ${user.id}`);

    if (!collection_id || !action) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields',
        code: 'LKC400',
        message: 'Collection ID and action are required'
      }), { status: 200, headers: corsHeaders });
    }

    if (!['like', 'unlike'].includes(action)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid action',
        code: 'LKC400',
        message: 'Action must be "like" or "unlike"'
      }), { status: 200, headers: corsHeaders });
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === 'like') {
      // Check if already liked first
      const { data: existing } = await supabase
        .from('collection_likes')
        .select('id')
        .eq('collection_id', collection_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Already liked - return success (idempotent)
        console.log(`Collection ${collection_id} already liked by user ${user.id}`);
        return new Response(JSON.stringify({
          success: true,
          action: 'like',
          code: 'LKC200',
          message: 'Collection liked successfully',
          collection_id
        }), { status: 200, headers: corsHeaders });
      }

      // Insert new like
      const { error: insertError } = await supabase
        .from('collection_likes')
        .insert({ collection_id, user_id: user.id });

      if (insertError) {
        console.error('Database error during like:', insertError);
        if ((insertError as any).code === '23503') { // Foreign key violation
          return new Response(JSON.stringify({
            success: false,
            error: 'Collection not found',
            code: 'LKC404',
            message: 'This collection doesn\'t exist or can\'t be liked'
          }), { status: 200, headers: corsHeaders });
        }
        return new Response(JSON.stringify({
          success: false,
          error: 'Database error',
          code: 'LKC500',
          message: 'Failed to like collection. Please try again.'
        }), { status: 200, headers: corsHeaders });
      }

      console.log(`Collection ${collection_id} liked successfully by user ${user.id}`);
    } else {
      // Unlike - delete if exists (idempotent)
      const { error: deleteError } = await supabase
        .from('collection_likes')
        .delete()
        .eq('collection_id', collection_id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Database error during unlike:', deleteError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Database error',
          code: 'LKC500',
          message: 'Failed to unlike collection. Please try again.'
        }), { status: 200, headers: corsHeaders });
      }

      console.log(`Collection ${collection_id} unliked successfully by user ${user.id}`);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      code: 'LKC200',
      message: `Collection ${action}d successfully`,
      collection_id
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Unexpected error in like-collection function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      code: 'LKC500',
      message: 'Something went wrong. Please try again.'
    }), { status: 200, headers: corsHeaders });
  }
});