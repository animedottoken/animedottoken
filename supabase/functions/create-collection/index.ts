
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCollectionRequest {
  id?: string;
  name: string;
  symbol?: string | null;
  site_description?: string | null;
  onchain_description?: string | null;
  image_url?: string | null;
  banner_image_url?: string | null;
  external_links?: any[] | null;
  category?: string | null;
  explicit_content?: boolean;
  supply_mode?: string;
  enable_primary_sales?: boolean;
  mint_price?: number | null;
  max_supply?: number | null;
  royalty_percentage?: number | null;
  treasury_wallet?: string | null;
  whitelist_enabled?: boolean;
  go_live_date?: string | null;
  mint_end_at?: string | null;
  locked_fields?: string[];
  attributes?: { trait_type: string; value: string; display_type?: string }[];
  creator_address: string; // wallet address
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: CreateCollectionRequest = await req.json();
    console.log('Create-collection request body:', body);

    if (!body || !body.name || !body.creator_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, creator_address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle supply mode
    const supplyMode = body.supply_mode || 'fixed';
    const isOpenEdition = supplyMode === 'open';
    const maxSupply = isOpenEdition ? null : (body.max_supply != null && Number(body.max_supply) > 0 ? Number(body.max_supply) : 1000);
    const itemsAvailable = isOpenEdition ? null : maxSupply;

    // Normalize other values
    const mintPrice = body.mint_price != null && Number(body.mint_price) >= 0 ? Number(body.mint_price) : 0;
    const royalty = body.royalty_percentage != null && Number(body.royalty_percentage) >= 0 ? Number(body.royalty_percentage) : 0;

    // Basic validations
    if (body.name.trim().length < 3 || body.name.trim().length > 32) {
      return new Response(
        JSON.stringify({ error: "Collection name must be between 3 and 32 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Symbol validation - only if provided
    if (body.symbol && body.symbol.trim() && (body.symbol.length < 2 || body.symbol.length > 10)) {
      return new Response(
        JSON.stringify({ error: "Symbol must be between 2 and 10 characters if provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supply mode validations
    if (!['fixed', 'open'].includes(supplyMode)) {
      return new Response(
        JSON.stringify({ error: "Supply mode must be 'fixed' or 'open'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.enable_primary_sales) {
      if (supplyMode === 'fixed' && (!maxSupply || maxSupply < 1 || maxSupply > 100000)) {
        return new Response(
          JSON.stringify({ error: "Max supply must be between 1 and 100000 when primary sales are enabled with fixed supply" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!body.treasury_wallet || body.treasury_wallet.trim() === "") {
        return new Response(
          JSON.stringify({ error: "Treasury wallet is required when primary sales are enabled" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (royalty < 0 || royalty > 50) {
        return new Response(
          JSON.stringify({ error: "Royalty must be between 0 and 50" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Date validation for mint_end_at
    if (body.mint_end_at) {
      const mintEndDate = new Date(body.mint_end_at);
      const year = mintEndDate.getFullYear();
      const now = new Date();
      const minEnd = new Date(now.getTime() + 60 * 60 * 1000); // require at least 1 hour in the future

      // Log server and received times for diagnostics
      console.log('mint_end_at received (ISO):', body.mint_end_at);
      console.log('mint_end_at parsed (UTC):', mintEndDate.toISOString(), 'timestamp:', mintEndDate.getTime());
      console.log('server now (UTC):', now.toISOString(), 'min acceptable (UTC):', minEnd.toISOString());
      
      if (year < 1000 || year > 9999) {
        return new Response(
          JSON.stringify({ error: "Mint end date year must be exactly 4 digits (YYYY)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (mintEndDate <= minEnd) {
        return new Response(
          JSON.stringify({ 
            error: "Mint end must be at least 1 hour in the future",
            receivedUtc: mintEndDate.toISOString(),
            serverNowUtc: now.toISOString(),
            requiredMinUtc: minEnd.toISOString()
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const insertData: any = {
      id: body.id,
      name: body.name,
      symbol: body.symbol && body.symbol.trim() ? body.symbol : null,
      description: body.site_description || null,
      site_description: body.site_description || null,
      onchain_description: body.onchain_description || null,
      image_url: body.image_url || null,
      banner_image_url: body.banner_image_url || null,
      creator_address: body.creator_address,
      treasury_wallet: body.treasury_wallet || body.creator_address,
      external_links: body.external_links || [],
      category: body.category || null,
      explicit_content: body.explicit_content ?? false,
      supply_mode: supplyMode,
      max_supply: maxSupply,
      items_available: itemsAvailable,
      items_redeemed: 0,
      mint_price: mintPrice,
      royalty_percentage: royalty,
      whitelist_enabled: body.whitelist_enabled ?? false,
      go_live_date: body.go_live_date || null,
      mint_end_at: body.mint_end_at || null,
      locked_fields: body.locked_fields || [],
      attributes: body.attributes || [], // Ensure it's always an array
      is_active: true,
      is_live: true,
      verified: false,
    };

    const { data, error } = await serviceClient
      .from('collections')
      .insert(insertData)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Insert error:', error);
      let errorMessage = 'Failed to create collection';
      
      // Surface specific database errors
      if (error.code === '23502') {
        errorMessage = `Required field missing: ${error.message}`;
      } else if (error.code === '23505') {
        errorMessage = 'Collection with this name already exists';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, collection: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected error creating collection' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
