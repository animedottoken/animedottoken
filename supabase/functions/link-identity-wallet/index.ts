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
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ success: false, error: "Missing Supabase configuration" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Verify JWT and get user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Invalid authentication" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Parse request body
    const { wallet_address, signature_message, wallet_signature } = await req.json();

    if (!wallet_address || !signature_message || !wallet_signature) {
      return new Response(JSON.stringify({ success: false, error: "Missing required parameters" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    console.log('link-identity-wallet request:', { 
      user_id: user.id,
      wallet_address,
      signature_message
    });

    // Validate message format (accept space or newline after "wallet" and both CRLF/LF)
    const expectedMessagePattern = /^I am linking this wallet[\r\n ]+(.+?) to my ANIME\.TOKEN account\.\r?\n\r?\nTimestamp: \d+$/;
    if (!expectedMessagePattern.test(signature_message)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid message format" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Ensure the wallet in the message matches the provided wallet_address
    const msgMatch = signature_message.match(/^I am linking this wallet[\r\n ]+(.+?) to my ANIME\.TOKEN account\./m);
    if (!msgMatch || msgMatch[1] !== wallet_address) {
      return new Response(JSON.stringify({ success: false, error: "Wallet address in message does not match provided wallet address" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Basic timestamp freshness check (within 60 minutes)
    const ts = signature_message.match(/Timestamp: (\d+)$/);
    if (ts) {
      const messageTimestamp = parseInt(ts[1]);
      const now = Date.now();
      const sixtyMinutes = 60 * 60 * 1000;
      if (Math.abs(now - messageTimestamp) > sixtyMinutes) {
        return new Response(JSON.stringify({ success: false, error: "Message timestamp is too old or too far in the future. Please generate a new message." }), {
          status: 200,
          headers: corsHeaders,
        });
      }
    }

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
      return new Response(JSON.stringify({ success: false, error: "Failed to check wallet status" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (existingWallet && existingWallet.user_id !== user.id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "This wallet is already linked to another account. Log in to that account or pick a different wallet.",
        code: "WALLET_ALREADY_LINKED"
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // TODO: In Phase 2, verify the wallet signature here
    // For demo mode, we'll just proceed with linking
    const signatureValid = true; // This would be the result of signature verification

    if (!signatureValid) {
      return new Response(JSON.stringify({ success: false, error: "Invalid wallet signature" }), {
        status: 200,
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
        success: false,
        error: "Failed to link wallet", 
        details: updateError.message 
      }), {
        status: 200,
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
    return new Response(JSON.stringify({ success: false, error: (err as Error).message || "Internal server error" }), {
      status: 200,
      headers: corsHeaders,
    });
  }
});