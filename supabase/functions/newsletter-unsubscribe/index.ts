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
    const email = url.searchParams.get('email')

    if (!email) {
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Invalid unsubscribe link</h2>
            <p>The email parameter is missing.</p>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      })
    }

    console.log(`📤 Processing newsletter unsubscribe for: ${email}`)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the subscription by email
    const { data: subscription, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
      .single()

    if (findError || !subscription) {
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #ffc107;">Email not found</h2>
            <p>We couldn't find an active subscription for this email address.</p>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      })
    }

    if (subscription.status === 'unsubscribed') {
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #6c757d;">Already unsubscribed</h2>
            <p>This email address is already unsubscribed from our newsletter.</p>
          </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      })
    }

    // Update subscription status to unsubscribed
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email)

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    console.log(`✅ Newsletter unsubscribe processed for: ${email}`)

    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #28a745;">Successfully unsubscribed</h2>
          <p>You have been unsubscribed from our newsletter.</p>
          <p>We're sorry to see you go! If you change your mind, you can always resubscribe.</p>
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
    console.error('Newsletter unsubscribe error:', error)
    
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">Something went wrong</h2>
          <p>We couldn't process your unsubscribe request. Please try again later.</p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html', ...corsHeaders }
    })
  }
})