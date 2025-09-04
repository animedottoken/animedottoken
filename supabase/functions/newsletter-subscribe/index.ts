import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
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
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const email = user.email

    console.log(`📬 Newsletter subscription request for: ${email}`)

    // Create Supabase client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate confirmation token
    const optInToken = crypto.randomUUID()

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
      .single()

    if (existing) {
      if (existing.status === 'confirmed') {
        return new Response(JSON.stringify({ 
          message: 'You are already subscribed to our newsletter!' 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      // Update existing pending subscription with new token
      await supabaseAdmin
        .from('newsletter_subscribers')
        .update({ 
          opt_in_token: optInToken,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
    } else {
      // Insert new subscription
      const { error: insertError } = await supabaseAdmin
        .from('newsletter_subscribers')
        .insert({
          email,
          opt_in_token: optInToken,
          status: 'pending'
        })

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw insertError
      }
    }

    // Create confirmation URL
    const confirmUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/newsletter-confirm?token=${optInToken}`

    // Build confirmation email HTML (no external template to keep deploy simple)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Confirm your subscription</title>
        </head>
        <body style="font-family: Arial, sans-serif; background:#000; color:#fff; padding:24px;">
          <div style="max-width:600px;margin:0 auto;background:#111;padding:32px;border-radius:8px;">
            <h1 style="margin-top:0;color:#8B5CF6;">ANIME.TOKEN Newsletter</h1>
            <p style="color:#ddd;">Hi${' ' + email}, please confirm your subscription.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${confirmUrl}" style="background:#8B5CF6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Confirm subscription</a>
            </div>
            <p style="color:#aaa;font-size:14px;">Or copy this link: <a href="${confirmUrl}" style="color:#8B5CF6;word-break:break-all;">${confirmUrl}</a></p>
            <p style="color:#666;font-size:12px;text-align:center;margin-top:24px;">If you didn't request this, ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    // Send confirmation email
    const { error: emailError } = await resend.emails.send({
      from: 'Newsletter <newsletter@animedottoken.com>',
      to: [email],
      subject: 'Please confirm your newsletter subscription',
      html,
      reply_to: 'support@animedottoken.com'
    })

    if (emailError) {
      console.error('Email send error:', emailError)
      throw emailError
    }

    console.log(`✅ Confirmation email sent to: ${email}`)

    return new Response(JSON.stringify({ 
      message: 'Please check your email to confirm your subscription!' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    
    return new Response(JSON.stringify({
      error: 'Failed to process subscription request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
