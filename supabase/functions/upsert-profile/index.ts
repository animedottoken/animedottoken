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
      console.log('upsert-profile auth error:', authError);
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    console.log('upsert-profile authenticated user:', user.id);

    // Parse request body
    const { 
      wallet_address, 
      nickname, 
      bio, 
      profile_image_url, 
      banner_image_url 
    } = await req.json();

    console.log('upsert-profile request:', { 
      user_id: user.id,
      wallet_address,
      nickname,
      bio,
      profile_image_url,
      banner_image_url
    });

    // Use service role for upsert
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if profile exists by user_id only (no wallet auto-linking)
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let result;
    
    if (existingProfile) {
      // Update existing profile
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only update provided fields
      if (nickname !== undefined) updateData.nickname = nickname;
      if (bio !== undefined) updateData.bio = bio;
      if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url;
      if (banner_image_url !== undefined) updateData.banner_image_url = banner_image_url;
      
      // Only link wallet_address if explicitly provided via link-identity-wallet function
      if (wallet_address !== undefined) {
        updateData.wallet_address = wallet_address;
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (updateError) {
        console.log('upsert-profile update error:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      result = updatedProfile;
    } else {
      // Create new profile
      const newProfile = {
        user_id: user.id,
        wallet_address: wallet_address || null,
        nickname: nickname || null,
        bio: bio || null,
        profile_image_url: profile_image_url || null,
        banner_image_url: banner_image_url || null,
        trade_count: 0,
        profile_rank: 'DEFAULT',
        pfp_unlock_status: false,
        bio_unlock_status: false,
        current_pfp_nft_mint_address: null,
        nft_count: 0,
        collection_count: 0,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.log('upsert-profile create error:', createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      result = createdProfile;
    }

    console.log('upsert-profile success:', result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('upsert-profile unexpected error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});