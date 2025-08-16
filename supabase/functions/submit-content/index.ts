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

  // Submissions have been moved to Discord - return 410 Gone
  return new Response(JSON.stringify({ 
    error: 'Submissions Moved', 
    message: 'NFT submissions have moved to our Discord community! Join us at https://discord.gg/EZ9wRhjr to submit your amazing art.',
    redirect_url: 'https://discord.gg/EZ9wRhjr'
  }), {
    status: 410, // Gone
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})