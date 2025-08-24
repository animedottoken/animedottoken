
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
    const { nft_id, user_wallet, action } = await req.json();

    if (!nft_id || !user_wallet || !action) {
      return new Response(JSON.stringify({ error: "nft_id, user_wallet, and action are required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!['like', 'unlike'].includes(action)) {
      return new Response(JSON.stringify({ error: "action must be 'like' or 'unlike'" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === 'like') {
      const { error } = await supabase
        .from("nft_likes")
        .insert({ 
          nft_id, 
          user_wallet,
          created_at: new Date().toISOString()
        });

      if (error) {
        // Check if already liked
        if (error.code === '23505') {
          return new Response(JSON.stringify({ error: "NFT already liked" }), {
            status: 409,
            headers: corsHeaders,
          });
        }
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("nft_likes")
        .delete()
        .eq("nft_id", nft_id)
        .eq("user_wallet", user_wallet);

      if (error) {
        throw error;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      nft_id,
      user_wallet
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
