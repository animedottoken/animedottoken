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
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Verify JWT with anon key client
    const jwt = authHeader.substring(7);
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: userError } = await authClient.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid JWT token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Get wallet address from authenticated user's metadata
    const userWallet = user.user_metadata?.wallet_address;
    if (!userWallet) {
      return new Response(JSON.stringify({ error: "No wallet address found in user metadata" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { bio, transaction_signature } = await req.json();

    // Validate bio
    if (!bio || typeof bio !== "string") {
      return new Response(JSON.stringify({ error: "Bio is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const trimmedBio = bio.trim();
    if (trimmedBio.length === 0) {
      return new Response(JSON.stringify({ error: "Bio cannot be empty" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (trimmedBio.length > 100) {
      return new Response(JSON.stringify({ error: "Bio must be 100 characters or less" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Rate limiting check
    const supabase = createClient(supabaseUrl, serviceKey);
    const rateLimitCheck = await supabase.rpc('check_rate_limit', {
      p_user_wallet: userWallet,
      p_endpoint: 'set-bio',
      p_max_requests: 5,
      p_window_minutes: 1
    });

    if (rateLimitCheck.error || !rateLimitCheck.data) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: corsHeaders,
      });
    }

    console.log('Setting bio for wallet:', userWallet);

    // Get current profile to check if this is first time
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('bio, bio_unlock_status')
      .eq('wallet_address', userWallet)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch current profile' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Check if this is the first time setting bio (free) or requires payment
    const isFirstTime = !currentProfile || (!currentProfile.bio && !currentProfile.bio_unlock_status);
    
    if (!isFirstTime) {
      // Verify transaction signature for paid bio updates
      if (!transaction_signature) {
        return new Response(JSON.stringify({ error: 'Transaction signature required for bio updates after first time' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // In production, verify the actual Solana transaction here
      // For now, we accept test signatures
      if (!transaction_signature.startsWith('test_tx_') && !transaction_signature.startsWith('simulated_')) {
        return new Response(JSON.stringify({ error: 'Invalid transaction signature' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }

    // Update profile using regular client with RLS
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: updatedProfile, error: updateError } = await userClient
      .from('user_profiles')
      .upsert({
        wallet_address: userWallet,
        bio: trimmedBio,
        bio_unlock_status: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      })
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update bio' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log('Bio updated successfully for wallet:', userWallet);

    return new Response(JSON.stringify({ 
      success: true, 
      profile: updatedProfile,
      is_first_time: isFirstTime
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error in set-bio function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});