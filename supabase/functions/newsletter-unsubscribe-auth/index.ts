import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🚫 Newsletter unsubscribe-auth request started');
    
    // Get user from JWT (authenticated request)
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header provided');
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      }
    );
    
    console.log('🔐 Getting user from JWT...');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    
    if (!user) {
      console.log('❌ No user found in JWT');
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userEmail = user.email;
    if (!userEmail) {
      console.log('❌ User email not found');
      return new Response(JSON.stringify({ error: "User email not found" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('✅ Authenticated user for unsubscribe:', userEmail);

    // Use service role key for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log('🔍 Finding subscription record...');

    // Find the subscription record by email
    const { data: subscription, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (findError) {
      console.error('❌ Database error finding subscription:', findError);
      return new Response(JSON.stringify({ 
        error: "Database error", 
        details: findError.message 
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log('📋 Subscription record found:', !!subscription);
    console.log('📋 Current status:', subscription?.status);

    if (!subscription) {
      console.log('❌ No subscription found');
      return new Response(JSON.stringify({ error: "No active subscription found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (subscription.status === 'unsubscribed') {
      console.log('✅ Already unsubscribed');
      return new Response(JSON.stringify({ 
        message: "Already unsubscribed",
        status: 'already_unsubscribed' 
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    console.log('🔄 Updating subscription status to unsubscribed...');

    // Update subscription status to unsubscribed
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', userEmail);

    if (updateError) {
      console.error('❌ Error updating subscription status:', updateError);
      return new Response(JSON.stringify({ 
        error: "Failed to unsubscribe", 
        details: updateError.message 
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log('✅ Successfully unsubscribed user:', userEmail);

    // Send confirmation email and update Resend audience (don't fail unsubscribe if these fail)
    let emailSent = false;
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      console.log('📧 Sending unsubscribe confirmation email...');
      const emailResponse = await resend.emails.send({
        from: Deno.env.get('RESEND_FROM_EMAIL') || 'ANIME.TOKEN Newsletter <onboarding@resend.dev>',
        to: [userEmail],
        subject: 'You have been unsubscribed',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6b7280 0%, #374151 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">ANIME.TOKEN Newsletter</h1>
            </div>
            
            <div style="padding: 40px 20px; background: #ffffff;">
              <h2 style="margin: 0 0 16px; color: #28a745; font-size: 24px;">Successfully unsubscribed</h2>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                You have been successfully unsubscribed from our newsletter. You will no longer receive updates at <strong>${userEmail}</strong>.
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
      emailSent = true;

      // Try to update contact in Resend audience if configured
      const audienceId = Deno.env.get("RESEND_NEWSLETTER_AUDIENCE_ID");
      if (audienceId) {
        try {
          console.log('👥 Marking contact as unsubscribed in Resend audience...');
          await resend.contacts.update({
            audienceId,
            email: userEmail,
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

    return new Response(JSON.stringify({ 
      message: "Successfully unsubscribed from newsletter",
      email: userEmail,
      status: 'unsubscribed',
      emailSent
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error('💥 Unexpected error in newsletter-unsubscribe-auth:', err);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});