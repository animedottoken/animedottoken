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

    // Get featured content with submission details
    // We'll join manually since the view relationship might not work as expected
    const { data: featuredContent, error } = await supabaseClient
      .from('featured_content')
      .select('position, featured_at, submission_id')
      .order('position')

    if (error) {
      console.error('Error fetching featured content:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get submission details directly from community_submissions (approved only)
    const submissionIds = featuredContent?.map(item => item.submission_id) || []
    const { data: submissions, error: submissionsError } = await supabaseClient
      .from('community_submissions')
      .select('id, image_url, caption, author, type, created_at')
      .in('id', submissionIds)
      .eq('status', 'approved')

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
      return new Response(JSON.stringify({ error: submissionsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Transform the data to match expected format
    const transformedData = featuredContent?.map(featuredItem => {
      const submission = submissions?.find(sub => sub.id === featuredItem.submission_id)
      if (!submission) return null
      
      return {
        id: submission.id,
        image: submission.image_url,
        caption: submission.caption,
        author: submission.author,
        type: submission.type,
        position: featuredItem.position,
        featured_at: featuredItem.featured_at
      }
    }).filter(Boolean) || []

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