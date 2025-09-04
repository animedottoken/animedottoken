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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); padding: 40px;">
              <h2 style="color: #dc3545; margin: 0 0 16px;">Invalid unsubscribe link</h2>
              <p style="color: #6b7280; margin: 0;">The unsubscribe token is missing or invalid.</p>
            </div>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      })
    }

    console.log(`🔗 Processing newsletter unsubscribe for token: ${token}`)

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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); padding: 40px;">
              <h2 style="color: #dc3545; margin: 0 0 16px;">Invalid unsubscribe link</h2>
              <p style="color: #6b7280; margin: 0;">This unsubscribe link is invalid or has already been used.</p>
            </div>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      })
    }

    if (subscription.unsubscribed_at) {
      return new Response(`
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); padding: 40px;">
              <h2 style="color: #28a745; margin: 0 0 16px;">Already unsubscribed</h2>
              <p style="color: #6b7280; margin: 0;">You have already been unsubscribed from our newsletter.</p>
            </div>
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
      .eq('opt_in_token', token)

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    console.log(`✅ Newsletter unsubscribed for: ${subscription.email}`)

    return new Response(`
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 20px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden;">
            <!-- Header -->
            <div style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6b7280 0%, #374151 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ANIME.TOKEN Newsletter</h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #28a745; font-size: 24px; font-weight: 600;">Successfully unsubscribed</h2>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.6;">You have been unsubscribed from our newsletter. You will no longer receive emails at <strong>${subscription.email}</strong></p>
              <p style="margin: 0 0 32px; color: #6b7280; font-size: 14px;">We're sorry to see you go! If you change your mind, you can always subscribe again from our website.</p>
              
              <div style="text-align: center;">
                <a href="/" style="display: inline-block; background: #8B5CF6; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Return to website</a>
              </div>
            </div>
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 20px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); padding: 40px;">
            <h2 style="color: #dc3545; margin: 0 0 16px;">Something went wrong</h2>
            <p style="color: #6b7280; margin: 0;">We couldn't process your unsubscribe request. Please try again later.</p>
          </div>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html', ...corsHeaders }
    })
  }
})