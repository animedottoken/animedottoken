import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateCollectionRequest {
  collection_id: string;
  updates: {
    mint_price?: number;
    treasury_wallet?: string;
    whitelist_enabled?: boolean;
    onchain_description?: string;
    max_supply?: number;
    royalty_percentage?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const { collection_id, updates }: UpdateCollectionRequest = await req.json()

    console.log('Update collection request:', { collection_id, updates })

    // Validate required fields
    if (!collection_id) {
      return new Response(
        JSON.stringify({ error: 'Missing collection_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the current user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify collection ownership and get current state
    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select('creator_address, items_redeemed')
      .eq('id', collection_id)
      .single()

    if (fetchError || !collection) {
      console.error('Collection not found:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (updates.mint_price !== undefined) {
      updateData.mint_price = updates.mint_price
    }
    if (updates.treasury_wallet !== undefined) {
      updateData.treasury_wallet = updates.treasury_wallet
    }
    if (updates.whitelist_enabled !== undefined) {
      updateData.whitelist_enabled = updates.whitelist_enabled
    }
    if (updates.onchain_description !== undefined) {
      updateData.onchain_description = updates.onchain_description
    }

    // Allow max_supply and royalty_percentage updates only if no NFTs have been minted
    const itemsRedeemed = collection.items_redeemed || 0;
    if (itemsRedeemed === 0) {
      if (updates.max_supply !== undefined) {
        updateData.max_supply = updates.max_supply;
        updateData.items_available = updates.max_supply;
      }
      if (updates.royalty_percentage !== undefined) {
        updateData.royalty_percentage = updates.royalty_percentage;
      }
    }

    // Update collection
    const { data: updatedCollection, error: updateError } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', collection_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update collection', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Collection updated successfully:', updatedCollection)

    return new Response(
      JSON.stringify({ 
        success: true, 
        collection: updatedCollection 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Update collection error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})