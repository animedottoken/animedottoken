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
  enable_primary_sales?: boolean;
  mint_price?: number | null;
  max_supply?: number | null;
  royalty_percentage?: number | null;
  treasury_wallet?: string | null;
  whitelist_enabled?: boolean;
  go_live_date?: string | null;
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

    if (!body || !body.name || !body.creator_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, creator_address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    if (body.enable_primary_sales) {
      if (!body.max_supply || body.max_supply < 1 || body.max_supply > 100000) {
        return new Response(
          JSON.stringify({ error: "Max supply must be between 1 and 100000 when primary sales are enabled" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!body.treasury_wallet || body.treasury_wallet.trim() === "") {
        return new Response(
          JSON.stringify({ error: "Treasury wallet is required when primary sales are enabled" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (body.royalty_percentage != null && (body.royalty_percentage < 0 || body.royalty_percentage > 50)) {
        return new Response(
          JSON.stringify({ error: "Royalty must be between 0 and 50" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const insertData: any = {
      id: body.id,
      name: body.name,
      symbol: body.symbol && body.symbol.trim() ? body.symbol : null, // optional
      description: body.site_description || null,
      site_description: body.site_description || null,
      onchain_description: body.onchain_description || null,
      image_url: body.image_url || null,
      banner_image_url: body.banner_image_url || null,
      creator_address: body.creator_address,
      treasury_wallet: body.treasury_wallet || body.creator_address, // ALWAYS set (NOT NULL)
      external_links: body.external_links || [],
      category: body.category || null,
      explicit_content: body.explicit_content ?? false,
      // Always satisfy NOT NULL + CHECK constraints
      max_supply: body.max_supply && body.max_supply > 0 ? body.max_supply : 1000,
      items_available: body.max_supply && body.max_supply > 0 ? body.max_supply : 1000,
      items_redeemed: 0,
      mint_price: body.mint_price ?? 0,
      royalty_percentage: body.royalty_percentage ?? 0,
      whitelist_enabled: body.whitelist_enabled ?? false,
      go_live_date: body.go_live_date || null,
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
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to create collection' }),
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
