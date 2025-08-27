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
    
    console.log(`NFT like request: ${action} - NFT: ${nft_id}, Wallet: ${user_wallet}`);

    if (!nft_id || !user_wallet || !action) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Missing required fields", 
        code: "LKN400",
        message: "NFT ID, wallet address, and action are required"
      }), {
        status: 200, // Always return 200 for consistent error handling
        headers: corsHeaders,
      });
    }

    if (!['like', 'unlike'].includes(action)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Invalid action", 
        code: "LKN400",
        message: "Action must be 'like' or 'unlike'"
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Server configuration error", 
        code: "LKN500",
        message: "Service is temporarily unavailable"
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === 'like') {
      // Check if already liked first
      const { data: existing } = await supabase
        .from("nft_likes")
        .select("id")
        .eq("nft_id", nft_id)
        .eq("user_wallet", user_wallet)
        .maybeSingle();

      if (existing) {
        // Already liked - return success (idempotent)
        console.log(`NFT ${nft_id} already liked by ${user_wallet}`);
        return new Response(JSON.stringify({ 
          success: true, 
          action: 'like',
          code: "LKN200",
          message: "NFT liked successfully",
          nft_id,
          user_wallet
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      // Insert new like
      const { error } = await supabase
        .from("nft_likes")
        .insert({ nft_id, user_wallet });

      if (error) {
        console.error("Database error during like:", error);
        if ((error as any).code === '23503') { // Foreign key violation
          return new Response(JSON.stringify({ 
            success: false,
            error: "NFT not found", 
            code: "LKN404",
            message: "This NFT doesn't exist or can't be liked"
          }), {
            status: 200,
            headers: corsHeaders,
          });
        }
        return new Response(JSON.stringify({ 
          success: false,
          error: "Database error", 
          code: "LKN500",
          message: "Failed to like NFT. Please try again."
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      console.log(`NFT ${nft_id} liked successfully by ${user_wallet}`);
    } else {
      // Unlike - delete if exists (idempotent)
      const { error } = await supabase
        .from("nft_likes")
        .delete()
        .eq("nft_id", nft_id)
        .eq("user_wallet", user_wallet);

      if (error) {
        console.error("Database error during unlike:", error);
        return new Response(JSON.stringify({ 
          success: false,
          error: "Database error", 
          code: "LKN500",
          message: "Failed to unlike NFT. Please try again."
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      console.log(`NFT ${nft_id} unliked successfully by ${user_wallet}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      code: "LKN200",
      message: `NFT ${action}d successfully`,
      nft_id,
      user_wallet
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('Unexpected error in like-nft function:', err);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Internal server error", 
      code: "LKN500",
      message: "Something went wrong. Please try again."
    }), {
      status: 200,
      headers: corsHeaders,
    });
  }
});