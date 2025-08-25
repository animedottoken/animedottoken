
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
    collection_mint_address?: string;
    locked_fields?: string[];
    supply_mode?: string;
    mint_end_at?: string | null;
    site_description?: string;
    name?: string;
    symbol?: string;
    category?: string;
    explicit_content?: boolean;
    external_links?: any[];
    enable_primary_sales?: boolean;
    attributes?: any[];
    is_live?: boolean; // allow toggling live state
    is_active?: boolean; // optional
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
      .select('creator_address, items_redeemed, locked_fields, supply_mode')
      .eq('id', collection_id)
      .single()

    if (fetchError || !collection) {
      console.error('Collection not found:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lockedFields = collection.locked_fields || [];
    const itemsRedeemed = collection.items_redeemed || 0;
    const currentSupplyMode = collection.supply_mode || 'fixed';

    // Prepare update data
    const updateData: any = {}
    
    // Check each field against locks and chain rules
    if (updates.mint_price !== undefined && !lockedFields.includes('mint_price')) {
      updateData.mint_price = updates.mint_price
    }
    
    if (updates.treasury_wallet !== undefined && !lockedFields.includes('treasury_wallet')) {
      updateData.treasury_wallet = updates.treasury_wallet
    }
    
    if (updates.whitelist_enabled !== undefined && !lockedFields.includes('whitelist_enabled')) {
      updateData.whitelist_enabled = updates.whitelist_enabled
    }
    
    if (updates.onchain_description !== undefined && !lockedFields.includes('onchain_description')) {
      updateData.onchain_description = updates.onchain_description
    }
    
    if (updates.collection_mint_address !== undefined && !lockedFields.includes('collection_mint_address')) {
      updateData.collection_mint_address = updates.collection_mint_address
    }

    if (updates.site_description !== undefined && !lockedFields.includes('site_description')) {
      updateData.site_description = updates.site_description
      updateData.description = updates.site_description // Keep both for compatibility
    }

    if (updates.name !== undefined && !lockedFields.includes('name')) {
      updateData.name = updates.name
    }

    if (updates.symbol !== undefined && !lockedFields.includes('symbol')) {
      updateData.symbol = updates.symbol
    }

    if (updates.category !== undefined && !lockedFields.includes('category')) {
      updateData.category = updates.category
    }

    if (updates.explicit_content !== undefined && !lockedFields.includes('explicit_content')) {
      updateData.explicit_content = updates.explicit_content
    }

    if (updates.external_links !== undefined && !lockedFields.includes('external_links')) {
      updateData.external_links = updates.external_links
    }

    if (updates.mint_end_at !== undefined && !lockedFields.includes('mint_end_at')) {
      updateData.mint_end_at = updates.mint_end_at
    }

    if (updates.enable_primary_sales !== undefined && !lockedFields.includes('enable_primary_sales')) {
      updateData.enable_primary_sales = updates.enable_primary_sales
    }

    if (updates.attributes !== undefined && !lockedFields.includes('attributes')) {
      updateData.attributes = updates.attributes
    }

    // Live/Active status toggles (not lockable)
    if (updates.is_live !== undefined) {
      updateData.is_live = updates.is_live
    }
    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active
    }

    // Supply mode can be changed if not locked and no NFTs minted
    if (updates.supply_mode !== undefined && !lockedFields.includes('supply_mode') && itemsRedeemed === 0) {
      updateData.supply_mode = updates.supply_mode
      
      // Handle supply mode changes
      if (updates.supply_mode === 'open') {
        updateData.max_supply = 0
        updateData.items_available = 0
      } else if (updates.supply_mode === 'fixed' && updates.max_supply !== undefined) {
        updateData.max_supply = updates.max_supply
        updateData.items_available = updates.max_supply
      }
    }

    // Allow max_supply and royalty_percentage updates only if no NFTs have been minted and not locked
    if (itemsRedeemed === 0) {
      if (updates.max_supply !== undefined && !lockedFields.includes('max_supply')) {
        // Only allow if supply mode is fixed
        if (currentSupplyMode === 'fixed' || updateData.supply_mode === 'fixed') {
          updateData.max_supply = updates.max_supply;
          updateData.items_available = updates.max_supply;
        }
      }
      if (updates.royalty_percentage !== undefined && !lockedFields.includes('royalty_percentage')) {
        updateData.royalty_percentage = updates.royalty_percentage;
      }
    }

    // Handle locked_fields updates (creator can always change their own locks)
    if (updates.locked_fields !== undefined) {
      updateData.locked_fields = updates.locked_fields;
    }

    // Auto-lock critical fields after first mint
    if (itemsRedeemed > 0) {
      const autoLockFields = ['max_supply', 'royalty_percentage', 'supply_mode'];
      const currentLocked = new Set(lockedFields);
      autoLockFields.forEach(field => currentLocked.add(field));
      updateData.locked_fields = Array.from(currentLocked);
    }

    // If no valid fields to update, return a clear error
    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update', details: 'Check locks and allowed fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
