import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from 'npm:resend@4.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  console.log('🔐 Processing auth email request...')

  try {
    const payload = await req.json()
    
    console.log('📦 Received webhook payload')
    console.log('📧 Resend key exists:', !!Deno.env.get('RESEND_API_KEY'))
    
    // Extract data from Supabase auth webhook payload
    const { user, email_data } = payload
    const { token_hash, redirect_to, email_action_type } = email_data
    
    if (!user?.email) {
      throw new Error('No user email found in payload')
    }

    console.log(`📧 Sending ${email_action_type} email to ${user.email}`)

    // Create magic link URL
    const magicLinkUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
    
    // Simple HTML email template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Sign in to ANIME.TOKEN</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 40px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6; margin: 0;">ANIME.TOKEN</h1>
            </div>
            
            <h2 style="color: #fff; text-align: center;">
              ${email_action_type === 'signup' ? 'Welcome!' : 'Sign in to your account'}
            </h2>
            
            <p style="color: #ccc; font-size: 16px; line-height: 1.5;">
              Click the button below to ${email_action_type === 'signup' ? 'confirm your email and complete registration' : 'sign in to your account'}:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLinkUrl}" 
                 style="background-color: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                ${email_action_type === 'signup' ? 'Confirm Email' : 'Sign In'}
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${magicLinkUrl}" style="color: #8B5CF6; word-break: break-all;">${magicLinkUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        </body>
      </html>
    `

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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})