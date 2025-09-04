import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    console.log('📧 Newsletter status check started');
    
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

    console.log('✅ Authenticated user:', userEmail);

    // Use service role key for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log('📊 Checking newsletter status in database for:', userEmail);

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
    console.log('📋 Subscription data:', subscription ? {
      status: subscription.status,
      created_at: subscription.created_at,
      confirmed_at: subscription.confirmed_at,
      unsubscribed_at: subscription.unsubscribed_at
    } : 'No record');

    const status = subscription ? subscription.status : 'not_subscribed';
    const subscribedAt = subscription?.confirmed_at || subscription?.created_at;
    const unsubscribedAt = subscription?.unsubscribed_at;
    const isSubscribed = status === 'confirmed';

    console.log('✅ Final newsletter status:', { 
      email: userEmail, 
      status, 
      isSubscribed,
      subscribedAt,
      unsubscribedAt 
    });

    return new Response(JSON.stringify({ 
      email: userEmail,
      status,
      subscribedAt,
      unsubscribedAt,
      isSubscribed
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error('💥 Unexpected error in newsletter-status:', err);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});