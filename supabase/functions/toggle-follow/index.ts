
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
    const authHeader = req.headers.get("authorization");

    const {
      creator_wallet,
      follower_wallet,
      action,
      signature,
      message,
      timestamp,
      session_token,
    } = await req.json();

    if (!creator_wallet || !follower_wallet || !action) {
      return new Response(
        JSON.stringify({ error: "creator_wallet, follower_wallet, and action are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['follow', 'unfollow'].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be 'follow' or 'unfollow'" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    let verified = false;

    // 1) Try session token verification if provided
    if (session_token) {
      try {
        const [payloadB64, signatureB64] = session_token.split('.');
        if (!payloadB64 || !signatureB64) {
          throw new Error("Invalid session token format");
        }

        const sessionPayload = atob(payloadB64);
        const sessionData = JSON.parse(sessionPayload);

        // Verify expiration
        if (Date.now() > sessionData.expires_at) {
          return new Response(JSON.stringify({ error: "Session token expired" }), {
            status: 401,
            headers: corsHeaders,
          });
        }

        // Verify wallet matches
        if (sessionData.wallet_address !== follower_wallet) {
          return new Response(JSON.stringify({ error: "Session wallet mismatch" }), {
            status: 403,
            headers: corsHeaders,
          });
        }

        // Verify HMAC signature
        const sessionSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!sessionSecret) {
          throw new Error("Missing session secret");
        }

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(sessionSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["verify"]
        );

        const providedSig = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify("HMAC", key, providedSig, encoder.encode(sessionPayload));
        
        if (isValid) {
          verified = true;
          console.log(`✅ Session token verified for wallet: ${follower_wallet}`);
        }
      } catch (e) {
        console.log("Session token verification failed:", e.message);
        // Fall through to other auth methods
      }
    }

    // 2) Try JWT verification if provided
    if (!verified && authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = authHeader.substring(7);
      const { data: { user }, error: userError } = await authClient.auth.getUser(jwt);
      if (!userError && user) {
        const userWallet = (user as any).user_metadata?.wallet_address;
        if (!userWallet || userWallet !== follower_wallet) {
          return new Response(JSON.stringify({ error: "Follower wallet address mismatch" }), {
            status: 403,
            headers: corsHeaders,
          });
        }
        verified = true;
      }
    }

    // 3) If no valid session token or JWT, verify Solana signature
    if (!verified) {
      if (!signature || !message || !timestamp) {
        return new Response(JSON.stringify({ error: "Missing signature parameters" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      // Replay protection: 10 minutes
      const now = Date.now();
      const ts = Number(timestamp);
      if (!Number.isFinite(ts) || Math.abs(now - ts) > 10 * 60 * 1000) {
        return new Response(JSON.stringify({ error: "Signature expired" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const expected = `toggle-follow:${creator_wallet}:${follower_wallet}:${action}:${timestamp}`;
      if (message !== expected) {
        return new Response(JSON.stringify({ error: "Invalid signed message" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      try {
        const msgBytes = new TextEncoder().encode(message);
        const sigBytes = bs58.decode(signature);
        const pubkeyBytes = bs58.decode(follower_wallet);
        const ok = nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
        if (!ok) {
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: corsHeaders,
          });
        }
        verified = true;
      } catch (e) {
        return new Response(JSON.stringify({ error: "Signature verification failed" }), {
          status: 401,
          headers: corsHeaders,
        });
      }
    }

    if (!verified) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Use service role for the actual operation (authorization already verified)
    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === 'follow') {
      const { error } = await supabase
        .from("creator_follows")
        .insert({ 
          creator_wallet, 
          follower_wallet,
          created_at: new Date().toISOString()
        });

      if (error) {
        // Check if already following
        if (error.code === '23505') {
          return new Response(JSON.stringify({ error: "Already following this creator" }), {
            status: 409,
            headers: corsHeaders,
          });
        }
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("creator_follows")
        .delete()
        .eq("creator_wallet", creator_wallet)
        .eq("follower_wallet", follower_wallet);

      if (error) {
        throw error;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      creator_wallet,
      follower_wallet
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
