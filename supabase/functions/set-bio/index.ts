import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { bio, transaction_signature, wallet_address: walletFromBody } = await req.json()
    
    // Try to get the user's wallet address from JWT if present, otherwise from request body
    let walletAddress = ''
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      try {
        const jwt = authHeader.replace('Bearer ', '')
        const payload = JSON.parse(atob(jwt.split('.')[1]))
        walletAddress = payload.wallet_address || ''
      } catch (_) {
        // ignore JWT parsing errors and fall back to body
      }
    }

    if (!walletAddress) {
      walletAddress = walletFromBody || ''
    }

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Setting bio for wallet:', walletAddress, 'Bio:', bio)

    // Validate inputs
    if (!bio || bio.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bio cannot be empty' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (bio.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: 'Bio must be 100 characters or less' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }


    // Get current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching profile:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch current profile' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if this is the first time setting bio (free) or requires payment
    const isFirstTime = !currentProfile || (!currentProfile.bio && !currentProfile.bio_unlock_status)
    
    if (!isFirstTime) {
      // Verify transaction signature for paid bio updates
      if (!transaction_signature || (!transaction_signature.startsWith('test_tx_') && !transaction_signature.startsWith('simulated_'))) {
        // In production, verify the actual transaction here
        return new Response(
          JSON.stringify({ error: 'Invalid transaction signature' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Update or create profile while preserving existing fields
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: walletAddress,
        bio: bio.trim(),
        bio_unlock_status: true,
        // Preserve existing fields
        nickname: currentProfile?.nickname || null,
        trade_count: currentProfile?.trade_count || 0,
        profile_rank: currentProfile?.profile_rank || 'DEFAULT',
        pfp_unlock_status: currentProfile?.pfp_unlock_status || false,
        current_pfp_nft_mint_address: currentProfile?.current_pfp_nft_mint_address || null,
        profile_image_url: currentProfile?.profile_image_url || null,
        banner_image_url: currentProfile?.banner_image_url || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      })
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update bio' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Bio updated successfully for wallet:', walletAddress)

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: updatedProfile,
        is_first_time: isFirstTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in set-bio function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})