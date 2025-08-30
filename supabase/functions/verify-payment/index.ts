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

  try {
    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Verify JWT and get user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Parse request body
    const { 
      tx_signature, 
      payment_wallet_address, 
      payment_type, 
      expected_amount 
    } = await req.json();

    if (!tx_signature || !payment_wallet_address || !payment_type || !expected_amount) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('verify-payment request:', { 
      user_id: user.id,
      tx_signature,
      payment_wallet_address,
      payment_type,
      expected_amount
    });

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // TODO: In Phase 2, verify the Solana transaction here
    // For demo mode, we'll just record the payment as verified
    const verified = true; // This would be the result of blockchain verification

    // Record the payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        wallet_address: payment_wallet_address,
        tx_signature: tx_signature,
        payment_type: payment_type,
        amount_anime: expected_amount,
        amount_usdt: 0, // For now, we only support ANIME payments
        anime_price: 1, // Assuming 1:1 for demo
        verified: verified
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment recording error:', paymentError);
      return new Response(JSON.stringify({ error: "Failed to record payment" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('Payment verification success:', payment);
    
    return new Response(JSON.stringify({ 
      verified: verified,
      payment_id: payment.id,
      receipt: {
        tx_signature: tx_signature,
        amount: expected_amount,
        payment_type: payment_type,
        verified_at: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('verify-payment unexpected error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});