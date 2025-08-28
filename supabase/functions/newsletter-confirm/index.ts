import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Invalid confirmation link</h2>
            <p>The confirmation token is missing or invalid.</p>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      })
    }

    console.log(`🔗 Processing newsletter confirmation for token: ${token}`)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the subscription by token
    const { data: subscription, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('opt_in_token', token)
      .single()

    if (findError || !subscription) {
      console.log('Subscription not found for token:', token)
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Invalid confirmation link</h2>
            <p>This confirmation link is invalid or has already been used.</p>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      })
    }

    if (subscription.status === 'confirmed') {
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #28a745;">Already confirmed!</h2>
            <p>Your email subscription is already active. Thank you!</p>
          </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      })
    }

    // Update subscription status to confirmed
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('opt_in_token', token)

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    console.log(`✅ Newsletter subscription confirmed for: ${subscription.email}`)

    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #28a745;">Subscription confirmed!</h2>
          <p>Thank you for subscribing to our newsletter!</p>
          <p>You'll receive our latest updates at <strong>${subscription.email}</strong></p>
          <div style="margin-top: 30px;">
            <a href="/" style="
              background-color: #007bff; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px;
              display: inline-block;
            ">Return to website</a>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html', ...corsHeaders }
    })

  } catch (error) {
    console.error('Newsletter confirm error:', error)
    
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">Something went wrong</h2>
          <p>We couldn't process your confirmation. Please try again later.</p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html', ...corsHeaders }
    })
  }
})