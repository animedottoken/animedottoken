import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@2.0.0"

// SECURITY: Mask email addresses in logs to prevent PII exposure
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : '***';
  return `${maskedLocal}@${domain}`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    console.log(`📬 Processing newsletter subscription for: ${maskEmail(email)}`)

    // Create admin Supabase client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Use secure newsletter subscription function with rate limiting
    console.log('🛡️ Checking rate limits...')
    const { data: rateLimitResult, error: rateLimitError } = await supabaseAdmin
      .rpc('check_newsletter_rate_limit', {
        p_email: email,
        p_operation: 'subscribe',
        p_max_attempts: 3,
        p_window_minutes: 60
      });

    if (rateLimitError || !rateLimitResult) {
      console.error('Rate limit exceeded for:', email);
      return new Response(JSON.stringify({ 
        error: 'Too many subscription attempts. Please try again later.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Use secure subscription function
    console.log('🔒 Using secure subscription function...')
    const { data: subscribeResult, error: subscribeError } = await supabaseAdmin
      .rpc('secure_newsletter_subscribe', {
        p_email: email
      });

    if (subscribeError) {
      console.error('❌ Secure subscription error:', subscribeError);
      return new Response(JSON.stringify({ 
        error: subscribeError.message || 'Failed to subscribe to newsletter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const optInToken = subscribeResult.opt_in_token;
    console.log('🎫 Generated secure opt-in token');

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
    
    // Get validated RESEND_FROM_EMAIL and API key
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;
    
    console.log('🔧 Email configuration check:', {
      fromEmailConfigured: !!fromEmail,
      fromEmailValid: fromEmail && fromEmail.includes('@') && fromEmail.includes('<') && fromEmail.includes('>'),
      apiKeyConfigured: !!resendApiKey,
      apiKeyLength: resendApiKey ? resendApiKey.length : 0
    });
    
    // Validate configuration before attempting to send
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      console.log('💡 Please set the RESEND_API_KEY in Supabase Edge Function secrets');
      console.log('⚠️ Skipping email send - will return confirmation URL for manual confirmation');
    } else if (!fromEmail || !fromEmail.includes('@')) {
      console.error('❌ RESEND_FROM_EMAIL not configured or invalid:', fromEmail);
      console.log('💡 Expected format: "ANIME.TOKEN Newsletter <newsletter@animedottoken.com>"');
      console.log('⚠️ Skipping email send - will return confirmation URL for manual confirmation');
    } else {
      // Initialize Resend only when we have valid configuration
      let resend;
      try {
        resend = new Resend(resendApiKey);
        console.log('✅ Resend client initialized successfully');
      } catch (resendInitError) {
        console.error('❌ Failed to initialize Resend client:', resendInitError);
        console.log('⚠️ Skipping email send - will return confirmation URL for manual confirmation');
      }
      
      if (resend) {
        console.log('📧 Using from address:', fromEmail);
        console.log('🔑 API key configured (length:', resendApiKey.length, ')');
        
        try {
          const emailPayload = {
            from: fromEmail,
            to: [email],
            subject: 'Please confirm your newsletter subscription',
            html,
            reply_to: 'support@animedottoken.com'
          };
          
          console.log('📤 Sending email with payload:', {
            from: fromEmail,
            to: maskEmail(email),
            subject: emailPayload.subject,
            htmlLength: html.length,
            replyTo: emailPayload.reply_to
          });
          
          const { error: emailError, data: emailData } = await resend.emails.send(emailPayload);

          if (emailError) {
            console.error('❌ Email send error:', emailError);
            console.log('💡 Common issues:');
            console.log('   - Domain not verified in Resend (check https://resend.com/domains)');
            console.log('   - Invalid API key (check https://resend.com/api-keys)');
            console.log('   - From email not matching verified domain');
            console.log('   - Rate limits exceeded');
            console.log('⚠️ Email failed but subscription record was created/updated');
          } else {
            console.log(`✅ Confirmation email sent successfully to: ${maskEmail(email)}`);
            console.log('📧 Email response:', emailData);
            emailSent = true;
          }
        } catch (sendError) {
          console.error('❌ Email send exception:', sendError);
          console.log('💡 This might indicate network issues or Resend service problems');
          console.log('⚠️ Email failed but subscription record was created/updated');
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: emailSent 
        ? 'Confirmation email sent! Please check your inbox.' 
        : 'Email delivery failed. Please use the confirmation link below.',
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