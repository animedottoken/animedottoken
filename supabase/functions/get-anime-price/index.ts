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

  // DEMO MODE - Always return demo price for testing
  console.log('DEMO MODE: Using demo price for ANIME token');
  return new Response(JSON.stringify({ 
    price: 0.001, // Demo price: 1 ANIME = $0.001 (very cheap for testing)
    source: 'demo',
    timestamp: Date.now(),
    demo: true
  }), {
    status: 200,
    headers: corsHeaders,
  });
});