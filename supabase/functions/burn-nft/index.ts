import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NODE_ENV === 'production' 
    ? "https://*.lovable.app" 
    : "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface BurnNFTRequest {
  nft_id: string;
  wallet_address: string;
  signature: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Verify JWT with anon key client
    const jwt = authHeader.substring(7);
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: userError } = await authClient.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid JWT token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userWallet = user.user_metadata?.wallet_address;
    if (!userWallet) {
      return new Response(JSON.stringify({ error: "No wallet address found in user metadata" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Use service role for the actual operation (now that auth is verified)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { nft_id, wallet_address, signature }: BurnNFTRequest = await req.json();

    // Verify the wallet address matches authenticated user
    if (wallet_address !== userWallet) {
      return new Response(JSON.stringify({ error: "Wallet address mismatch" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    console.log('Burn NFT request:', { nft_id, wallet_address });

    if (!nft_id || !wallet_address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: nft_id, wallet_address' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get NFT details and verify ownership
    const { data: nft, error: nftError } = await supabase
      .from('nfts')
      .select('*')
      .eq('id', nft_id)
      .single();

    if (nftError || !nft) {
      console.error('NFT not found:', nftError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'NFT not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user owns the NFT
    if (nft.owner_address !== wallet_address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You can only burn NFTs you own' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For now, we'll just delete the NFT record from the database
    // In a real implementation, you would burn it on-chain first
    const { error: deleteError } = await supabase
      .from('nfts')
      .delete()
      .eq('id', nft_id);

    if (deleteError) {
      console.error('Failed to burn NFT:', deleteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to burn NFT' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update collection supply counters
    if (nft.collection_id) {
      await supabase
        .from('collections')
        .update({ 
          items_redeemed: Math.max(0, (nft.collection_id ? 1 : 0)),
          items_available: Math.min(999999, 1)
        })
        .eq('id', nft.collection_id);
    }

    console.log(`Successfully burned NFT: ${nft_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'NFT burned successfully',
        burned_nft: {
          id: nft.id,
          name: nft.name,
          mint_address: nft.mint_address
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in burn-nft function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});