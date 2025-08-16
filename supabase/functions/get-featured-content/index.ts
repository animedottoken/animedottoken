import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get featured content with submission details using public view
    const { data: featuredContent, error } = await supabaseClient
      .from('featured_content')
      .select(`
        position,
        featured_at,
        public_submissions (
          id,
          image_url,
          caption,
          author,
          type,
          created_at
        )
      `)
      .order('position')

    if (error) {
      console.error('Error fetching featured content:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Transform the data to match expected format
    const transformedData = featuredContent?.map(item => ({
      id: item.public_submissions.id,
      image: item.public_submissions.image_url,
      caption: item.public_submissions.caption,
      author: item.public_submissions.author,
      type: item.public_submissions.type,
      position: item.position,
      featured_at: item.featured_at
    })) || []

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-featured-content function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})