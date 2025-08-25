import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

// Real ANIME token mint address
const ANIME_TOKEN_ADDRESS = "ANIMEjZxSdTdB3KNKZPMFzXJNg2BnQG6hYx2K5hHnJKP";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch price from Jupiter API
    const response = await fetch(
      `https://price.jup.ag/v4/price?ids=${ANIME_TOKEN_ADDRESS}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch price from Jupiter API');
    }

    const data = await response.json();
    const animePrice = data.data?.[ANIME_TOKEN_ADDRESS]?.price;

    if (!animePrice) {
      // Fallback price for testing - 1 ANIME = 0.02 USDT
      console.log('Using fallback price for ANIME token');
      return new Response(JSON.stringify({ 
        price: 0.02,
        source: 'fallback',
        timestamp: Date.now()
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ 
      price: animePrice,
      source: 'jupiter',
      timestamp: Date.now()
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Price fetch error:', error);
    
    // Return fallback price on error
    return new Response(JSON.stringify({ 
      price: 0.02,
      source: 'fallback',
      timestamp: Date.now(),
      error: error.message
    }), {
      status: 200,
      headers: corsHeaders,
    });
  }
});