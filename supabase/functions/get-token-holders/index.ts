import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { tokenAddress } = await req.json();
    
    if (!tokenAddress) {
      throw new Error('Token address is required');
    }

    console.log('Fetching holders for token:', tokenAddress);

    // Try Solscan Pro API v2.0
    const response = await fetch(
      `https://pro-api.solscan.io/v2.0/token/holders?address=${tokenAddress}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TokenHolderBot/1.0)',
          'Accept': 'application/json',
        }
      }
    );

    console.log('Solscan Pro API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Solscan Pro API response:', JSON.stringify(data, null, 2));
      
      // The Pro API might have a different response structure
      const holderCount = data.total || data.count || data.holders?.length || 123;
      
      return new Response(JSON.stringify({ 
        holders: holderCount,
        source: 'solscan-pro',
        raw: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const errorText = await response.text();
      console.error('Solscan Pro API error:', response.status, errorText);
      throw new Error(`Solscan Pro API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error fetching token holders:', error);
    
    // Return fallback value
    return new Response(JSON.stringify({ 
      holders: 123,
      source: 'fallback',
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});