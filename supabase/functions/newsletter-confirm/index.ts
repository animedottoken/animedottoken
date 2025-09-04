import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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
              <h2 style="color: #dc3545; margin: 0 0 16px;">Invalid confirmation link</h2>
              <p style="color: #6b7280; margin: 0;">The confirmation token is missing or invalid.</p>
            </div>
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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); padding: 40px;">
              <h2 style="color: #dc3545; margin: 0 0 16px;">Invalid confirmation link</h2>
              <p style="color: #6b7280; margin: 0;">This confirmation link is invalid or has already been used.</p>
            </div>
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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); padding: 40px;">
              <h2 style="color: #28a745; margin: 0 0 16px;">Already confirmed!</h2>
              <p style="color: #6b7280; margin: 0;">Your email subscription is already active. Thank you!</p>
            </div>
          </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      })
    }

    // Update subscription status to confirmed
    const { data: updateData, error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('opt_in_token', token)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    // Add confirmed subscriber to Resend audience
    const audienceId = Deno.env.get('RESEND_NEWSLETTER_AUDIENCE_ID')
    if (audienceId && subscription?.email) {
      try {
        console.log('Adding subscriber to Resend audience:', subscription.email)
        await resend.contacts.create({
          email: subscription.email,
          unsubscribed: false,
          audienceId: audienceId,
        })
        console.log('Successfully added to Resend audience')
      } catch (resendError) {
        console.error('Error adding to Resend audience:', resendError)
        // Don't fail the confirmation if Resend sync fails
      }
    }

    console.log(`✅ Newsletter subscription confirmed for: ${subscription.email}`)

    // Send "Subscription confirmed" email to appear in Resend
    try {
      console.log('📧 Sending subscription confirmed email...');
      const emailResponse = await resend.emails.send({
        from: 'ANIME.TOKEN Newsletter <onboarding@resend.dev>',
        to: [subscription.email],
        subject: 'Newsletter subscription confirmed!',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20a744 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">ANIME.TOKEN Newsletter</h1>
            </div>
            
            <div style="padding: 40px 20px; background: #ffffff;">
              <h2 style="margin: 0 0 16px; color: #28a745; font-size: 24px;">✅ Subscription confirmed!</h2>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Thank you for confirming your subscription! You are now signed up to receive our newsletter updates at <strong>${subscription.email}</strong>.
              </p>
              <p style="margin: 0 0 32px; color: #6b7280; font-size: 14px;">
                You'll be the first to know about new drops, events, and community updates.
              </p>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://eztzddykjnmnpoeyfqcg.supabase.co', 'https://animecoin.io') || '#'}" 
                   style="display: inline-block; background: #8B5CF6; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Visit website
                </a>
              </div>
            </div>
          </div>
        `,
      });

      console.log('✅ Subscription confirmed email sent:', emailResponse);
    } catch (emailError) {
      console.log('⚠️ Failed to send subscription confirmed email (non-critical):', emailError);
    }

    // Redirect to profile page with confirmation
    const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('https://eztzddykjnmnpoeyfqcg.supabase.co', 'https://animecoin.io') || 'https://animecoin.io'}/profile?newsletter=confirmed`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('Newsletter confirm error:', error)
    
    return new Response(`
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 20px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); padding: 40px;">
            <h2 style="color: #dc3545; margin: 0 0 16px;">Something went wrong</h2>
            <p style="color: #6b7280; margin: 0;">We couldn't process your confirmation. Please try again later.</p>
          </div>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html', ...corsHeaders }
    })
  }
})