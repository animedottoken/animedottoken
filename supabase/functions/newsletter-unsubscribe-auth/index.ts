import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Get user from JWT (authenticated request)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
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
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log('Authentication error:', authError);
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return new Response(JSON.stringify({ error: "User email not found" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Use service role key for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log('Processing unsubscribe for authenticated user:', userEmail);

    // Find the subscription record by email
    const { data: subscription, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.log('Database error finding subscription:', findError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!subscription) {
      return new Response(JSON.stringify({ error: "No active subscription found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (subscription.status === 'unsubscribed') {
      return new Response(JSON.stringify({ message: "Already unsubscribed" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

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
      console.log('Error updating subscription status:', updateError);
      return new Response(JSON.stringify({ error: "Failed to unsubscribe" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log('Successfully unsubscribed user:', userEmail);

    return new Response(JSON.stringify({ 
      message: "Successfully unsubscribed from newsletter",
      email: userEmail 
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error('Unexpected error in newsletter-unsubscribe-auth:', err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});