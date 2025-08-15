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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      image_url, 
      caption, 
      author, 
      author_bio,
      contact,
      tags = [],
      edition_type = 'standard',
      type = 'picture', 
      submission_source = 'form' 
    } = await req.json()

    // Validate required fields
    if (!image_url || !caption || !author || !author_bio || !type || !tags || tags.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: image_url, caption, author, author_bio, type, and at least 1 tag are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate tags array length
    if (!tags || tags.length === 0 || tags.length > 3) {
      return new Response(JSON.stringify({ 
        error: 'Tags are required: minimum 1 tag, maximum 3 tags allowed' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert new submission
    const { data: submission, error } = await supabaseClient
      .from('community_submissions')
      .insert({
        image_url,
        caption,
        author,
        author_bio,
        contact,
        tags,
        edition_type,
        type,
        submission_source,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating submission:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('New submission created:', submission.id)

    return new Response(JSON.stringify({ 
      success: true, 
      submission_id: submission.id,
      message: 'Submission received! It will be reviewed before being featured.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in submit-content function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})