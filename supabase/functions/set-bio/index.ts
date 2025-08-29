import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

console.log("Set-bio function started - COMPLETELY PUBLIC (no JWT)");

serve(async (req) => {
  console.log(`🚀 Received ${req.method} request to set-bio`);
  
  if (req.method === "OPTIONS") {
    console.log("✅ Handling OPTIONS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log("❌ Invalid method:", req.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    console.log("📝 Starting bio update process");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("🔧 Environment check:", { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!serviceKey,
      urlPrefix: supabaseUrl?.substring(0, 20) + "...",
      keyPrefix: serviceKey?.substring(0, 10) + "..."
    });

    if (!supabaseUrl || !serviceKey) {
      console.error("❌ Missing Supabase configuration");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    let requestBody;
    try {
      const textBody = await req.text();
      console.log("📥 Raw request body:", textBody);
      requestBody = JSON.parse(textBody);
      console.log("📦 Parsed request body:", requestBody);
    } catch (error) {
      console.error("❌ JSON parsing error:", error);
      return new Response(JSON.stringify({ error: "Invalid JSON format" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { wallet_address, bio, transaction_signature } = requestBody;
    
    console.log("🔍 Request data validation:", {
      wallet_address: wallet_address?.substring(0, 10) + "...",
      bio_length: bio?.length,
      bio_preview: bio?.substring(0, 20),
      has_tx_sig: !!transaction_signature
    });

    // Validate wallet address
    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.length < 32) {
      console.error("❌ Invalid wallet address");
      return new Response(JSON.stringify({ error: 'Valid wallet address is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate bio
    if (!bio || typeof bio !== "string") {
      console.error("❌ Invalid bio type");
      return new Response(JSON.stringify({ error: "Bio must be a non-empty string" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const trimmedBio = bio.trim();
    if (trimmedBio.length === 0) {
      console.error("❌ Bio is empty after trimming");
      return new Response(JSON.stringify({ error: "Bio cannot be empty" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (trimmedBio.length > 150) {
      console.error("❌ Bio too long:", trimmedBio.length);
      return new Response(JSON.stringify({ error: "Bio must be 150 characters or less" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log("✅ Input validation passed");

    // Create Supabase client with service role (bypasses all RLS)
    console.log("🔑 Creating Supabase client with service role");
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Simple rate limiting check
    console.log("⏱️ Checking rate limit for wallet:", wallet_address.substring(0, 10) + "...");
    try {
      const { data: rateLimitData, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_user_wallet: wallet_address,
        p_endpoint: 'set-bio',
        p_max_requests: 10,
        p_window_minutes: 5
      });

      console.log("📊 Rate limit result:", { rateLimitData, rateLimitError });

      if (rateLimitError || !rateLimitData) {
        console.warn("⚠️ Rate limit check failed, proceeding anyway");
      }
    } catch (rateLimitError) {
      console.warn("⚠️ Rate limit function error:", rateLimitError);
      // Continue anyway, don't block on rate limiting
    }

    // Check current profile
    console.log("🔍 Fetching current profile");
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('bio, bio_unlock_status')
      .eq('wallet_address', wallet_address)
      .maybeSingle();

    console.log("👤 Current profile:", { currentProfile, fetchError });

    // Determine if this is first time
    const isFirstTime = !currentProfile || (!currentProfile.bio && !currentProfile.bio_unlock_status);
    console.log("🆕 Is first time bio:", isFirstTime);
    
    // For non-first-time updates, validate transaction signature
    if (!isFirstTime && (!transaction_signature || typeof transaction_signature !== 'string')) {
      console.error("❌ Missing transaction signature for paid update");
      return new Response(JSON.stringify({ error: 'Payment transaction required for bio updates' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Update profile using service role key (bypasses ALL security policies)
    console.log("💾 Upserting profile with bio");
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: wallet_address,
        bio: trimmedBio,
        bio_unlock_status: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      })
      .select()
      .single();

    console.log("💾 Update result:", { 
      success: !updateError, 
      profile_id: updatedProfile?.id,
      error: updateError 
    });

    if (updateError) {
      console.error('❌ Database update failed:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update bio', 
        details: updateError.message 
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log('✅ Bio updated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      profile: {
        wallet_address: updatedProfile.wallet_address,
        bio: updatedProfile.bio,
        bio_unlock_status: updatedProfile.bio_unlock_status
      },
      is_first_time: isFirstTime,
      message: 'Bio updated successfully'
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('❌ Unexpected error in set-bio:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});