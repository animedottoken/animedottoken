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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const { wallet_address, bio, transaction_signature } = await req.json();
    
    // Validate required fields
    if (!wallet_address || typeof wallet_address !== 'string') {
      return new Response(JSON.stringify({ error: 'wallet_address is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

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

    if (trimmedBio.length > 90) {
      return new Response(JSON.stringify({ error: "Bio must be 90 characters or less" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceKey);

    // Rate limiting check
    const rateLimitCheck = await supabase.rpc('check_rate_limit', {
      p_user_wallet: wallet_address,
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

    console.log('Setting bio for wallet:', wallet_address);

    // Get current profile to check if this is first time
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('bio, bio_unlock_status')
      .eq('wallet_address', wallet_address)
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
      if (!transaction_signature.startsWith('test_tx_') && !transaction_signature.startsWith('simulated_')) {
        return new Response(JSON.stringify({ error: 'Invalid transaction signature' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }

    // Update profile using service role (bypasses RLS)
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

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update bio', details: updateError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log('Bio updated successfully for wallet:', wallet_address);

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