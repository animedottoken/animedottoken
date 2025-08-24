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

    const { bio, transaction_signature } = await req.json()
    
    // Get the user's wallet address from the request headers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Extract wallet address from JWT payload
    const jwt = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(atob(jwt.split('.')[1]))
    const walletAddress = payload.wallet_address

    if (!walletAddress) {
      throw new Error('Wallet address not found in token')
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

    if (!transaction_signature) {
      return new Response(
        JSON.stringify({ error: 'Transaction signature required' }),
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
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError)
      throw new Error('Failed to fetch current profile')
    }

    // Check if this is the first time setting bio (free) or requires payment
    const isFirstTime = !currentProfile || (!currentProfile.bio && !currentProfile.bio_unlock_status)
    
    if (!isFirstTime) {
      // Verify transaction signature for paid bio updates
      if (!transaction_signature.startsWith('test_tx_')) {
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

    // Update or create profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: walletAddress,
        bio: bio.trim(),
        bio_unlock_status: true,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw new Error('Failed to update bio')
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