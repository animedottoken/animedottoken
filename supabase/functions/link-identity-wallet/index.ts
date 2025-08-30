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
    const { wallet_address, signature_message, wallet_signature } = await req.json();

    if (!wallet_address || !signature_message || !wallet_signature) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('link-identity-wallet request:', { 
      user_id: user.id,
      wallet_address,
      signature_message
    });

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if this wallet is already linked to another account
    const { data: existingWallet, error: walletCheckError } = await supabase
      .from("user_profiles")
      .select("user_id, wallet_address")
      .eq("wallet_address", wallet_address)
      .maybeSingle();

    if (walletCheckError) {
      console.error('Wallet check error:', walletCheckError);
      return new Response(JSON.stringify({ error: "Failed to check wallet status" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (existingWallet && existingWallet.user_id !== user.id) {
      return new Response(JSON.stringify({ 
        error: "This wallet is already linked to another account. Log in to that account or pick a different wallet.",
        code: "WALLET_ALREADY_LINKED"
      }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    // TODO: In Phase 2, verify the wallet signature here
    // For demo mode, we'll just proceed with linking
    const signatureValid = true; // This would be the result of signature verification

    if (!signatureValid) {
      return new Response(JSON.stringify({ error: "Invalid wallet signature" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Link the wallet to the user's profile
    const { data: profile, error: updateError } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        wallet_address: wallet_address,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError, {
        user_id: user.id,
        wallet_address,
        error_code: updateError.code,
        error_details: updateError.details
      });
      return new Response(JSON.stringify({ 
        error: "Failed to link wallet", 
        details: updateError.message 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('Identity wallet linked successfully:', profile);
    
    return new Response(JSON.stringify({ 
      success: true,
      wallet_address: wallet_address,
      linked_at: new Date().toISOString()
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('link-identity-wallet unexpected error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});