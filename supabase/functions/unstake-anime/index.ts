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
      p_endpoint: 'unstake-anime',
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

    // Get user's current total staked amount
    const totalStaked = await supabaseClient.rpc('get_user_total_staked', {
      p_wallet_address: wallet_address
    });

    if (totalStaked.error || !totalStaked.data) {
      return new Response(
        JSON.stringify({ error: 'Failed to get staked amount' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (amount > parseFloat(totalStaked.data)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient staked amount' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find the user's stakes and determine which ones to unstake from
    const { data: userStakes, error: stakesError } = await supabaseClient
      .from('anime_stakes')
      .select('*')
      .eq('user_id', user.id)
      .eq('wallet_address', wallet_address)
      .eq('is_active', true)
      .order('staked_at', { ascending: true }); // FIFO unstaking

    if (stakesError || !userStakes || userStakes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active stakes found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process unstaking using the database function
    let remainingAmount = amount;
    const unstakedStakes = [];

    for (const stake of userStakes) {
      if (remainingAmount <= 0) break;

      const stakeAmount = parseFloat(stake.staked_amount);
      const unstakeFromThis = Math.min(remainingAmount, stakeAmount);

      // Use the database function to handle partial/full unstaking
      const { data: unstakeResult, error: unstakeError } = await supabaseClient.rpc('unstake_anime', {
        p_stake_id: stake.id,
        p_amount: unstakeFromThis
      });

      if (unstakeError) {
        console.error('Error unstaking:', unstakeError);
        return new Response(
          JSON.stringify({ error: 'Failed to unstake tokens' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      unstakedStakes.push({
        stake_id: stake.id,
        unstaked_amount: unstakeFromThis,
        remaining_staked: unstakeResult.remaining_staked
      });

      remainingAmount -= unstakeFromThis;
    }

    // Log security event
    await supabaseClient
      .from('security_events')
      .insert({
        user_id: user.id,
        event_type: 'anime_unstake_completed',
        severity: 'info',
        wallet_address: wallet_address,
        metadata: {
          total_unstaked: amount,
          stakes_affected: unstakedStakes,
          timestamp: new Date().toISOString()
        }
      });

    // In a real implementation, we would:
    // 1. Execute a Solana transaction to transfer tokens back to the user's wallet
    // 2. Verify the transaction was successful
    // 3. Only then update the database records

    return new Response(
      JSON.stringify({
        success: true,
        unstaked_amount: amount,
        stakes_affected: unstakedStakes,
        message: 'Successfully unstaked ANIME tokens'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unstaking function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});