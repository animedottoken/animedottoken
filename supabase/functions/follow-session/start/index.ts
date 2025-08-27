import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@6.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NODE_ENV === 'production' 
    ? "https://*.lovable.app" 
    : "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      wallet_address,
      signature,
      message,
      timestamp,
    } = await req.json();

    if (!wallet_address || !signature || !message || !timestamp) {
      return new Response(
        JSON.stringify({ error: "wallet_address, signature, message, and timestamp are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify signature timestamp (10 minutes expiry)
    const now = Date.now();
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > 10 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Signature expired" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify the signed message format
    const expected = `follow-session-start:${wallet_address}:${timestamp}`;
    if (message !== expected) {
      return new Response(JSON.stringify({ error: "Invalid signed message" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify the signature
    try {
      const msgBytes = new TextEncoder().encode(message);
      const sigBytes = bs58.decode(signature);
      const pubkeyBytes = bs58.decode(wallet_address);
      const ok = nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
      if (!ok) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: corsHeaders,
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: "Signature verification failed" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Generate session token using HMAC
    const sessionSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!sessionSecret) {
      throw new Error("Missing session secret");
    }

    const sessionData = {
      wallet_address,
      issued_at: now,
      expires_at: now + (15 * 60 * 1000), // 15 minutes
    };

    const sessionPayload = JSON.stringify(sessionData);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(sessionSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature_buffer = await crypto.subtle.sign("HMAC", key, encoder.encode(sessionPayload));
    const sessionSignature = btoa(String.fromCharCode(...new Uint8Array(signature_buffer)));
    
    const sessionToken = btoa(sessionPayload) + "." + sessionSignature;

    console.log(`🎫 Generated session token for wallet: ${wallet_address}`);

    return new Response(JSON.stringify({ 
      success: true,
      session_token: sessionToken,
      expires_at: sessionData.expires_at
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error("Session start error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});