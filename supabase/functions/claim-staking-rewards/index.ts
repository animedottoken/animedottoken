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

    const { wallet_address } = await req.json();

    // Validation
    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting check
    const rateLimitCheck = await supabaseClient.rpc('check_rate_limit', {
      p_user_wallet: wallet_address,
      p_endpoint: 'claim-rewards',
      p_max_requests: 5,
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

    // Get user's active stakes to calculate pending rewards
    const { data: userStakes, error: stakesError } = await supabaseClient
      .from('anime_stakes')
      .select('*')
      .eq('user_id', user.id)
      .eq('wallet_address', wallet_address)
      .eq('is_active', true);

    if (stakesError || !userStakes || userStakes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active stakes found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate and create reward records for each stake
    let totalRewardsClaimed = 0;
    const rewardRecords = [];

    for (const stake of userStakes) {
      // Calculate pending rewards for this stake
      const { data: pendingRewards, error: rewardsError } = await supabaseClient.rpc('calculate_pending_rewards', {
        p_stake_id: stake.id
      });

      if (rewardsError) {
        console.error('Error calculating rewards:', rewardsError);
        continue;
      }

      const rewardAmount = parseFloat(pendingRewards || '0');
      if (rewardAmount <= 0) continue;

      // Create reward record
      const { data: rewardRecord, error: createRewardError } = await supabaseClient
        .from('anime_staking_rewards')
        .insert({
          stake_id: stake.id,
          user_id: user.id,
          reward_type: 'yield_share',
          reward_amount: rewardAmount,
          reward_period_start: stake.last_reward_claim,
          reward_period_end: new Date().toISOString(),
          claimed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createRewardError) {
        console.error('Error creating reward record:', createRewardError);
        continue;
      }

      // Update stake's last reward claim timestamp
      await supabaseClient
        .from('anime_stakes')
        .update({ 
          last_reward_claim: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', stake.id);

      totalRewardsClaimed += rewardAmount;
      rewardRecords.push(rewardRecord);
    }

    if (totalRewardsClaimed <= 0) {
      return new Response(
        JSON.stringify({ error: 'No rewards available to claim' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log security event
    await supabaseClient
      .from('security_events')
      .insert({
        user_id: user.id,
        event_type: 'staking_rewards_claimed',
        severity: 'info',
        wallet_address: wallet_address,
        metadata: {
          total_rewards_claimed: totalRewardsClaimed,
          reward_records: rewardRecords.length,
          timestamp: new Date().toISOString()
        }
      });

    // In a real implementation, we would:
    // 1. Execute a Solana transaction to transfer reward tokens to the user's wallet
    // 2. Verify the transaction was successful
    // 3. Only then mark the rewards as claimed

    return new Response(
      JSON.stringify({
        success: true,
        total_rewards_claimed: totalRewardsClaimed,
        reward_records: rewardRecords,
        message: `Successfully claimed ${totalRewardsClaimed.toFixed(4)} ANIME tokens in rewards`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Claim rewards function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});