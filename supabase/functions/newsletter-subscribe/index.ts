import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@4.0.0"
import React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { NewsletterConfirmEmail } from '../send-email/_templates/newsletter-confirm.tsx'

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
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ 
        error: 'Valid email address is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log(`📬 Newsletter subscription request for: ${email}`)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate confirmation token
    const optInToken = crypto.randomUUID()

    // Check if email already exists
    const { data: existing } = await supabase
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
      await supabase
        .from('newsletter_subscribers')
        .update({ 
          opt_in_token: optInToken,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
    } else {
      // Insert new subscription
      const { error: insertError } = await supabase
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

    // Render confirmation email
    const html = await renderAsync(
      React.createElement(NewsletterConfirmEmail, {
        confirmUrl,
        email
      })
    )

    // Send confirmation email
    const { error: emailError } = await resend.emails.send({
      from: 'Newsletter <onboarding@resend.dev>',
      to: [email],
      subject: 'Please confirm your newsletter subscription',
      html
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