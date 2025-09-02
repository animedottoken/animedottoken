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
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Please log in to follow creators' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Verify JWT and get user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Your session has expired. Please log in again.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { creator_wallet, action } = await req.json();

    if (!creator_wallet || !action) {
      return new Response(
        JSON.stringify({ error: "creator_wallet and action are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['follow', 'unfollow'].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be 'follow' or 'unfollow'" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, serviceKey);

    console.log(`${action} request: Creator ${creator_wallet}, User: ${user.id}`);

    // Get user's wallet address from user_wallets table
    const { data: userWallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('wallet_address')
      .eq('user_id', user.id)
      .eq('wallet_type', 'primary')
      .eq('is_verified', true)
      .single();

    if (walletError || !userWallet) {
      return new Response(
        JSON.stringify({ error: 'User wallet not found. Please connect a wallet first.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (action === 'follow') {
      const { error } = await supabase
        .from("creator_follows")
        .insert({ 
          creator_wallet, 
          user_id: user.id,
          follower_wallet: userWallet.wallet_address,
          created_at: new Date().toISOString()
        });

      if (error) {
        // Check if already following
        if (error.code === '23505') {
          return new Response(JSON.stringify({ 
            success: true,
            message: "Already following this creator",
            creator_wallet,
            user_id: user.id 
          }), {
            status: 200,
            headers: corsHeaders,
          });
        }
        console.error('Database error during follow:', error);
        return new Response(JSON.stringify({ error: "Failed to follow creator" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      console.log(`User ${user.id} successfully followed creator ${creator_wallet}`);
    } else {
      const { error } = await supabase
        .from("creator_follows")
        .delete()
        .eq("creator_wallet", creator_wallet)
        .eq("user_id", user.id);

      if (error) {
        console.error('Database error during unfollow:', error);
        return new Response(JSON.stringify({ error: "Failed to unfollow creator" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      console.log(`User ${user.id} successfully unfollowed creator ${creator_wallet}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      creator_wallet,
      user_id: user.id
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('Unexpected error in toggle-follow:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});