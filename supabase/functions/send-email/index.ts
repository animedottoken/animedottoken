import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { MagicLinkEmail } from './_templates/magic-link.tsx'

// Check for required environment variables
const resendApiKey = Deno.env.get('RESEND_API_KEY')
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')

console.log('Environment check:', {
  resendApiKey: resendApiKey ? 'SET' : 'MISSING',
  hookSecret: hookSecret ? 'SET' : 'MISSING',
})

if (!resendApiKey) {
  throw new Error('RESEND_API_KEY environment variable is not set')
}

if (!hookSecret) {
  throw new Error('SEND_EMAIL_HOOK_SECRET environment variable is not set')
}

const resend = new Resend(resendApiKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    console.log('Received webhook payload for custom email')
    
    const wh = new Webhook(hookSecret)
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    }

    console.log(`Sending ${email_action_type} email to ${user.email}`)

    // Determine email subject based on action type
    const getEmailSubject = (actionType: string) => {
      switch (actionType) {
        case 'signup':
          return '🎌 Welcome to ANIME.TOKEN - Verify your account'
        case 'recovery':
          return '🔐 Reset your ANIME.TOKEN password'
        case 'email_change':
          return '📧 Confirm your new email for ANIME.TOKEN'
        default:
          return '🔗 Your magic link to ANIME.TOKEN'
      }
    }

    console.log(`Rendering email template for action: ${email_action_type}`)

    // Render the React email template
    const html = await renderAsync(
      React.createElement(MagicLinkEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token,
        token_hash,
        redirect_to,
        email_action_type,
      })
    )

    console.log('Email template rendered successfully')

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'ANIME.TOKEN <onboarding@resend.dev>',
      to: [user.email],
      subject: getEmailSubject(email_action_type),
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully:', data)

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })

  } catch (error: any) {
    console.error('Error in send-email function:', error)
    
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
      }),
      {
        status: error.code === 'WEBHOOK_VERIFICATION_ERROR' ? 401 : 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})