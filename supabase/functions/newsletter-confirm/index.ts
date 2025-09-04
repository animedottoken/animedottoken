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

    // Send confirmation email
    try {
      console.log('📧 Sending subscription confirmed email...');
      const emailResponse = await resend.emails.send({
        from: Deno.env.get('RESEND_FROM_EMAIL') || 'ANIME.TOKEN Newsletter <onboarding@resend.dev>',
        to: [subscription.email],
        subject: 'Newsletter subscription confirmed!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">Welcome to ANIME.TOKEN Newsletter! 🎉</h1>
            <p style="font-size: 16px; line-height: 1.6;">Thank you for confirming your subscription to our newsletter.</p>
            <p style="font-size: 16px; line-height: 1.6;">You'll now receive updates about the latest NFT drops, community events, and exclusive announcements.</p>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">Visit your profile to manage your newsletter preferences anytime.</p>
            </div>
          </div>
        `,
      });
      
      console.log('✅ Subscription confirmed email sent:', emailResponse);
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError);
      // Don't fail the entire operation if email fails
    }
    
    // Return HTML page with confirmation message and redirect
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://animecoin.io';
    const redirectUrl = `${siteUrl}/profile?newsletter=confirmed`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Newsletter Subscription Confirmed</title>
        <meta http-equiv="refresh" content="3;url=${redirectUrl}">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 40px 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
          .container { 
            background: white; 
            border-radius: 12px; 
            padding: 40px; 
            text-align: center; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
            max-width: 500px; 
            width: 100%; 
          }
          h1 { color: #2563eb; margin-bottom: 20px; font-size: 28px; }
          p { color: #666; line-height: 1.6; margin-bottom: 15px; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 8px; 
            text-decoration: none; 
            margin-top: 20px; 
            font-weight: 600; 
          }
          .countdown { color: #888; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">🎉</div>
          <h1>Newsletter Subscription Confirmed!</h1>
          <p><strong>Thank you for joining the ANIME.TOKEN newsletter!</strong></p>
          <p>You'll now receive updates about the latest NFT drops, community events, and exclusive announcements.</p>
          <a href="${redirectUrl}" class="button">Continue to Your Profile</a>
          <div class="countdown">Redirecting automatically in <span id="timer">3</span> seconds...</div>
        </div>
        <script>
          let count = 3;
          const timer = setInterval(() => {
            count--;
            document.getElementById('timer').textContent = count;
            if (count <= 0) {
              clearInterval(timer);
              window.location.href = '${redirectUrl}';
            }
          }, 1000);
        </script>
      </body>
      </html>
    `;
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        ...corsHeaders,
      },
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