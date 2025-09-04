import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@4.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }

  try {
    console.log('📧 Newsletter subscribe request started')
    
    // For authenticated edge functions (verify_jwt = true), user info is available in JWT
    const authHeader = req.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('❌ No auth header found')
      return new Response(JSON.stringify({ 
        error: 'Authentication required. Please sign in first.' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Create Supabase client with the user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    console.log('🔐 Getting user from JWT...')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      console.log('❌ Auth error:', userError.message)
      return new Response(JSON.stringify({ 
        error: 'Authentication failed: ' + userError.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
    
    if (!user?.email) {
      console.log('❌ No user or email found:', { user: !!user, email: user?.email })
      return new Response(JSON.stringify({ 
        error: 'Authentication required. Please sign in with a valid email.' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const email = user.email
    console.log(`📬 Processing newsletter subscription for: ${email}`)

    // Create admin Supabase client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate confirmation token
    const optInToken = crypto.randomUUID()
    console.log('🎫 Generated opt-in token:', optInToken)

    // Check if email already exists
    console.log('🔍 Checking for existing subscription...')
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      console.error('❌ Error checking existing subscription:', existingError)
      throw existingError
    }

    console.log('📋 Existing subscription:', existing ? {
      status: existing.status,
      created_at: existing.created_at,
      confirmed_at: existing.confirmed_at
    } : 'None found')

    if (existing) {
      if (existing.status === 'confirmed') {
        console.log('✅ Already confirmed subscription found')
        return new Response(JSON.stringify({ 
          message: 'You are already subscribed to our newsletter!',
          status: 'already_subscribed'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      // Update existing pending subscription with new token
      console.log('🔄 Updating existing pending subscription')
      const { error: updateError } = await supabaseAdmin
        .from('newsletter_subscribers')
        .update({ 
          opt_in_token: optInToken,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (updateError) {
        console.error('❌ Error updating existing subscription:', updateError)
        throw updateError
      }
    } else {
      // Insert new subscription
      console.log('➕ Creating new subscription record')
      const { error: insertError } = await supabaseAdmin
        .from('newsletter_subscribers')
        .insert({
          email,
          opt_in_token: optInToken,
          status: 'pending'
        })

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        throw insertError
      }
    }

    // Create confirmation and unsubscribe URLs
    const confirmUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/newsletter-confirm?token=${optInToken}`
    const unsubscribeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/newsletter-unsubscribe?token=${optInToken}`

    console.log('🔗 Generated URLs:', {
      confirmUrl: confirmUrl.substring(0, 50) + '...',
      unsubscribeUrl: unsubscribeUrl.substring(0, 50) + '...'
    })

    // Build unified confirmation email HTML to match Magic Link style
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Confirm Your ANIME.TOKEN Newsletter Subscription</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden;">
            <!-- Header -->
            <div style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ANIME.TOKEN Newsletter</h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Welcome to the community!</h2>
                <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">Click below to confirm your newsletter subscription and stay up to date with the latest news, drops, and events.</p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${confirmUrl}" style="display: inline-block; background: #8B5CF6; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Confirm Subscription</a>
              </div>
              
              <!-- Alternative link -->
              <div style="margin: 24px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 500;">Or copy this link:</p>
                <p style="margin: 0; color: #8B5CF6; font-size: 12px; word-break: break-all; font-family: monospace;">${confirmUrl}</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="padding: 24px 40px; background: #f8f9fa; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 12px; color: #9ca3af; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                Need help? <a href="https://discord.gg/animedottoken" style="color: #8B5CF6; text-decoration: none; font-weight: 500;">Join our Discord support</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send confirmation email
    console.log('📨 Sending confirmation email...')
    
    // Get validated RESEND_FROM_EMAIL - no fallback
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    let emailSent = false;
    
    if (!fromEmail || !fromEmail.includes('@')) {
      console.error('❌ RESEND_FROM_EMAIL not configured or invalid:', fromEmail);
      console.log('⚠️ Skipping email send - will return confirmation URL for manual confirmation');
    } else {
      console.log('📧 Using from address:', fromEmail);
      
      try {
        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject: 'Please confirm your newsletter subscription',
          html,
          reply_to: 'support@animedottoken.com'
        });

        if (emailError) {
          console.error('❌ Email send error:', emailError);
          console.log('⚠️ Email failed but subscription record was created/updated');
        } else {
          console.log(`✅ Confirmation email sent successfully to: ${email}`);
          emailSent = true;
        }
      } catch (sendError) {
        console.error('❌ Email send exception:', sendError);
        console.log('⚠️ Email failed but subscription record was created/updated');
      }
    }

    return new Response(JSON.stringify({ 
      message: emailSent 
        ? 'Please check your email to confirm your subscription!' 
        : 'Please use the confirmation link below to complete your subscription.',
      status: 'confirmation_sent',
      email: email,
      emailSent: emailSent,
      confirmUrl: confirmUrl
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error('💥 Newsletter subscribe error:', error)
    
    return new Response(JSON.stringify({
      error: 'Failed to process subscription request. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})