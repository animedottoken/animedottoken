import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@2.0.0"

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

    // Send confirmation email and update Resend audience (don't fail unsubscribe if these fail)
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      console.log('📧 Sending unsubscribe confirmation email...');
      const emailResponse = await resend.emails.send({
        from: 'ANIME.TOKEN Newsletter <newsletter@animecoin.io>',
        to: [subscription.email],
        subject: 'You have been unsubscribed',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6b7280 0%, #374151 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">ANIME.TOKEN Newsletter</h1>
            </div>
            
            <div style="padding: 40px 20px; background: #ffffff;">
              <h2 style="margin: 0 0 16px; color: #28a745; font-size: 24px;">Successfully unsubscribed</h2>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                You have been successfully unsubscribed from our newsletter. You will no longer receive updates at <strong>${subscription.email}</strong>.
              </p>
              <p style="margin: 0 0 32px; color: #6b7280; font-size: 14px;">
                We're sorry to see you go! If you change your mind, you can always subscribe again from our website.
              </p>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://eztzddykjnmnpoeyfqcg.supabase.co', 'https://animecoin.io') || '#'}" 
                   style="display: inline-block; background: #8B5CF6; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Return to website
                </a>
              </div>
            </div>
          </div>
        `,
      });

      console.log('✅ Unsubscribe confirmation email sent:', emailResponse);

      // Try to update contact in Resend audience if configured
      const audienceId = Deno.env.get("RESEND_NEWSLETTER_AUDIENCE_ID");
      if (audienceId) {
        try {
          console.log('👥 Marking contact as unsubscribed in Resend audience...');
          await resend.contacts.update({
            audienceId,
            email: subscription.email,
            unsubscribed: true
          });
          console.log('✅ Contact marked as unsubscribed in Resend audience');
        } catch (audienceError) {
          console.log('⚠️ Failed to update Resend audience (non-critical):', audienceError);
        }
      }

    } catch (emailError) {
      console.log('⚠️ Failed to send unsubscribe confirmation email (non-critical):', emailError);
    }

    // Redirect to profile page with unsubscribe confirmation
    const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('https://eztzddykjnmnpoeyfqcg.supabase.co', 'https://animecoin.io') || 'https://animecoin.io'}/profile?newsletter=unsubscribed`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }
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