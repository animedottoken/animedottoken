import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { MagicLinkEmail } from './_templates/magic-link.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  console.log('🔐 Processing auth email request...')

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
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

    console.log(`📧 Sending ${email_action_type} email to ${user.email}`)

    // Render the React Email template
    const html = await renderAsync(
      React.createElement(MagicLinkEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token,
        token_hash,
        redirect_to,
        email_action_type,
      })
    )

    // Send the email using Resend
    const { error } = await resend.emails.send({
      from: 'Auth <onboarding@resend.dev>',
      to: [user.email],
      subject: email_action_type === 'signup' ? 'Welcome! Confirm your email' : 'Sign in to your account',
      html,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      throw error
    }

    console.log('✅ Email sent successfully')
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Send email error:', error)
    
    return new Response(JSON.stringify({
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})