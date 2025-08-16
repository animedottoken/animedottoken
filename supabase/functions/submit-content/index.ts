import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// URL validation helper
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return ['http:', 'https:'].includes(parsedUrl.protocol) &&
           /\.(jpg|jpeg|png|gif|webp)$/i.test(parsedUrl.pathname)
  } catch {
    return false
  }
}

// Content validation helper
function validateContent(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.image_url || typeof data.image_url !== 'string') {
    errors.push('Image URL is required')
  } else if (!isValidImageUrl(data.image_url)) {
    errors.push('Invalid image URL format')
  }
  
  if (!data.caption || typeof data.caption !== 'string') {
    errors.push('Caption is required')
  } else if (data.caption.length > 500) {
    errors.push('Caption must be 500 characters or less')
  }
  
  if (!data.author || typeof data.author !== 'string') {
    errors.push('Author is required')
  } else if (data.author.length > 100) {
    errors.push('Author name must be 100 characters or less')
  }
  
  if (data.contact && data.contact.length > 100) {
    errors.push('Contact info must be 100 characters or less')
  }
  
  if (data.author_bio && data.author_bio.length > 500) {
    errors.push('Author bio must be 500 characters or less')
  }
  
  if (data.tags && (!Array.isArray(data.tags) || data.tags.length > 5)) {
    errors.push('Tags must be an array with maximum 5 items')
  }
  
  return { isValid: errors.length === 0, errors }
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

    const submissionData = await req.json()
    
    // Validate input data
    const validation = validateContent(submissionData)
    if (!validation.isValid) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: validation.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { 
      image_url, 
      name,
      caption, 
      author, 
      author_bio,
      contact,
      nft_address,
      tags = [],
      edition_type = 'standard',
      type = 'picture', 
      submission_source = 'form' 
    } = submissionData

    // Basic required field validation (legacy support)
    if (!image_url || !name || !caption || !author) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: image_url, name, caption, and author are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate tags array length if provided
    if (tags && tags.length > 5) {
      return new Response(JSON.stringify({ 
        error: 'Maximum 5 tags allowed' 
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
        name,
        caption,
        author,
        author_bio,
        contact,
        nft_address,
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