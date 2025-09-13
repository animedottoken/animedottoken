import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { wallet_address, amount } = await req.json();

    // Validation
    if (!wallet_address || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address or amount' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting check
    const rateLimitCheck = await supabaseClient.rpc('check_rate_limit', {
      p_user_wallet: wallet_address,
      p_endpoint: 'stake-anime',
      p_max_requests: 10,
      p_window_minutes: 5
    });

    if (!rateLimitCheck.data) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // In a real implementation, we would:
    // 1. Verify the user actually owns the specified amount of ANIME tokens
    // 2. Execute a Solana transaction to transfer tokens to a staking program
    // 3. Verify the transaction was successful
    
    // For now, we'll simulate this by directly creating the stake record
    
    // Create new stake record
    const { data: newStake, error: stakeError } = await supabaseClient
      .from('anime_stakes')
      .insert({
        user_id: user.id,
        wallet_address: wallet_address,
        staked_amount: amount,
        staked_at: new Date().toISOString(),
        is_active: true,
        last_reward_claim: new Date().toISOString()
      })
      .select()
      .single();

    if (stakeError) {
      console.error('Error creating stake:', stakeError);
      return new Response(
        JSON.stringify({ error: 'Failed to create stake record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log security event
    await supabaseClient
      .from('security_events')
      .insert({
        user_id: user.id,
        event_type: 'anime_stake_created',
        severity: 'info',
        wallet_address: wallet_address,
        metadata: {
          stake_id: newStake.id,
          amount: amount,
          timestamp: new Date().toISOString()
        }
      });

    // Create initial reward record for vault access
    if (amount >= 1000) {
      await supabaseClient
        .from('anime_staking_rewards')
        .insert({
          stake_id: newStake.id,
          user_id: user.id,
          reward_type: 'vault_access',
          reward_amount: 0, // Vault access is a privilege, not a token reward
          reward_period_start: new Date().toISOString(),
          reward_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        stake: newStake,
        message: 'Successfully staked ANIME tokens'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Staking function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});