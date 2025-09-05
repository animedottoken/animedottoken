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
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
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
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
      })
    }

    if (subscription.status === 'confirmed') {
      const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://animedottoken.com';
      const redirectUrl = `${siteUrl}/profile?newsletter=already-confirmed`;
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
          ...corsHeaders,
        },
      });
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

    // Add confirmed subscriber to Resend audience (optional)
    const audienceId = Deno.env.get('RESEND_NEWSLETTER_AUDIENCE_ID')
    if (audienceId && subscription?.email) {
      try {
        console.log('Adding subscriber to Resend audience:', subscription.email)
        if (resend.contacts) {
          await resend.contacts.create({
            email: subscription.email,
            unsubscribed: false,
            audienceId: audienceId,
          })
          console.log('Successfully added to Resend audience')
        }
      } catch (resendError: any) {
        // Handle restricted API key gracefully
        if (resendError?.statusCode === 401 && resendError?.name === 'restricted_api_key') {
          console.log('ℹ️ Resend API key is restricted to email sending only - skipping audience management')
        } else {
          console.error('Error adding to Resend audience:', resendError)
        }
        // Don't fail the confirmation if Resend sync fails
      }
    }

    console.log(`✅ Newsletter subscription confirmed for: ${subscription.email}`)

    // Send confirmation email
    try {
      console.log('📧 Sending subscription confirmed email...');
      
      // Validate and use RESEND_FROM_EMAIL with fallback
      const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
      const validatedFrom = fromEmail && fromEmail.includes('@') ? fromEmail : 'ANIME.TOKEN Newsletter <onboarding@resend.dev>';
      
      console.log('📧 Using from address:', validatedFrom);
      
      const emailResponse = await resend.emails.send({
        from: validatedFrom,
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
    
    // Return HTTP redirect to profile with success message
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://animedottoken.com';
    const redirectUrl = `${siteUrl}/profile?newsletter=confirmed`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        ...corsHeaders,
      },
    });

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
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
    })
  }
})