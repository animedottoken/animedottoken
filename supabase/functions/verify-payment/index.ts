import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "https://esm.sh/@solana/web3.js@1.87.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

/**
 * Verifies a Solana transaction on the blockchain
 * @param txSignature - Transaction signature to verify
 * @param expectedAmount - Expected amount in SOL
 * @param expectedRecipient - Expected recipient wallet address
 * @param rpcUrl - Solana RPC endpoint URL
 * @returns Verification result with details or error
 */
async function verifySolanaTransaction(
  txSignature: string,
  expectedAmount: number,
  expectedRecipient: string,
  rpcUrl: string
): Promise<{ verified: boolean; error?: string; details?: any }> {
  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // Step 1: Fetch transaction from blockchain
    console.log(`🔍 Fetching transaction: ${txSignature}`);
    const transaction = await connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });
    
    if (!transaction) {
      return { verified: false, error: 'Transaction not found on blockchain' };
    }
    
    // Step 2: Check confirmation status
    if (!transaction.meta || transaction.meta.err) {
      return { 
        verified: false, 
        error: transaction.meta?.err 
          ? `Transaction failed: ${JSON.stringify(transaction.meta.err)}`
          : 'Transaction not confirmed'
      };
    }
    
    // Step 3: Verify transaction timestamp (prevent replay attacks)
    const blockTime = transaction.blockTime;
    if (!blockTime) {
      return { verified: false, error: 'Transaction timestamp missing' };
    }
    
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 5 * 60; // 5 minutes
    if (now - blockTime > maxAge) {
      return { 
        verified: false, 
        error: `Transaction too old (${Math.floor((now - blockTime) / 60)} minutes). Max age: 5 minutes.` 
      };
    }
    
    // Step 4: Verify payment amount and recipient
    const recipientPubkey = new PublicKey(expectedRecipient);
    const accountKeys = transaction.transaction.message.accountKeys;
    
    // Find recipient in transaction
    const recipientIndex = accountKeys.findIndex(key => 
      key.toBase58() === recipientPubkey.toBase58()
    );
    
    if (recipientIndex === -1) {
      return { 
        verified: false, 
        error: `Expected recipient ${expectedRecipient.slice(0, 8)}... not found in transaction` 
      };
    }
    
    // Calculate actual amount transferred
    const preBalances = transaction.meta.preBalances;
    const postBalances = transaction.meta.postBalances;
    const amountTransferred = (postBalances[recipientIndex] - preBalances[recipientIndex]) / LAMPORTS_PER_SOL;
    
    // Allow 0.01 SOL tolerance for transaction fees
    const tolerance = 0.01;
    if (Math.abs(amountTransferred - expectedAmount) > tolerance) {
      return { 
        verified: false, 
        error: `Amount mismatch. Expected: ${expectedAmount} SOL, Got: ${amountTransferred} SOL` 
      };
    }
    
    // Step 5: All checks passed
    console.log('✅ Blockchain verification successful');
    return { 
      verified: true, 
      details: {
        blockTime: new Date(blockTime * 1000).toISOString(),
        amountTransferred,
        recipient: expectedRecipient,
        slot: transaction.slot,
        confirmations: 'confirmed'
      }
    };
    
  } catch (error) {
    console.error('❌ Blockchain verification error:', error);
    return { 
      verified: false, 
      error: `Verification failed: ${error.message}` 
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Verify JWT and get user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Parse request body
    const { 
      tx_signature, 
      payment_wallet_address, 
      payment_type, 
      expected_amount,
      collection_id,
      token_mint
    } = await req.json();

    if (!tx_signature || !payment_wallet_address || !payment_type || !expected_amount) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate tx_signature format (prevent fake signatures)
    if (tx_signature.startsWith('demo_tx_')) {
      return new Response(JSON.stringify({ 
        error: "Invalid transaction signature. Demo transactions are not accepted." 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('verify-payment request:', { 
      user_id: user.id,
      tx_signature,
      payment_wallet_address,
      payment_type,
      expected_amount
    });

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // STEP 1: Rate limiting (10 attempts per minute per user)
    const { data: rateLimitOk } = await supabase.rpc('check_security_event_rate_limit', {
      p_user_id: user.id,
      p_max_events: 10,
      p_window_minutes: 1
    });

    if (!rateLimitOk) {
      await supabase.from('security_events').insert({
        event_type: 'payment_rate_limit_exceeded',
        severity: 'high',
        user_id: user.id,
        wallet_address: payment_wallet_address,
        metadata: { tx_signature, payment_type, expected_amount }
      });
      
      return new Response(JSON.stringify({ 
        error: "Too many payment verification attempts. Please wait a minute and try again." 
      }), {
        status: 429,
        headers: corsHeaders,
      });
    }

    // STEP 2: Determine expected recipient based on payment type
    let expectedRecipient: string;
    let recipientSource: string;

    if (payment_type === 'mint_fee') {
      if (!collection_id) {
        return new Response(JSON.stringify({ error: "collection_id required for mint_fee" }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('treasury_wallet, name')
        .eq('id', collection_id)
        .single();
      
      if (collectionError || !collection) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }
      
      expectedRecipient = collection.treasury_wallet;
      recipientSource = `Collection: ${collection.name}`;
      
    } else if (payment_type === 'boost_bid') {
      const { data: settings } = await supabase
        .from('marketplace_settings')
        .select('platform_wallet_address')
        .single();
      
      expectedRecipient = settings?.platform_wallet_address || '7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8';
      recipientSource = 'Platform Wallet';
      
    } else if (payment_type === 'nft_purchase') {
      return new Response(JSON.stringify({ 
        error: "nft_purchase verification not yet implemented" 
      }), {
        status: 501,
        headers: corsHeaders,
      });
      
    } else {
      return new Response(JSON.stringify({ error: "Invalid payment type" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // STEP 3: Get RPC URL from environment
    const cluster = Deno.env.get("SOLANA_CLUSTER") || 'devnet';
    const rpcUrl = Deno.env.get("SOLANA_RPC_URL") || 
      (cluster === 'mainnet-beta' || cluster === 'mainnet'
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com');

    console.log(`🔍 Verifying transaction on ${cluster}...`);

    // STEP 4: Verify the transaction on blockchain
    const verificationResult = await verifySolanaTransaction(
      tx_signature,
      expected_amount,
      expectedRecipient,
      rpcUrl
    );

    // STEP 5: Handle verification failure
    if (!verificationResult.verified) {
      console.error('❌ Payment verification failed:', verificationResult.error);
      
      // Log failed verification
      await supabase.from('security_events').insert({
        event_type: 'payment_verification_failed',
        severity: 'high',
        user_id: user.id,
        wallet_address: payment_wallet_address,
        metadata: {
          tx_signature,
          payment_type,
          expected_amount,
          expected_recipient: expectedRecipient,
          error: verificationResult.error,
          cluster
        }
      });
      
      return new Response(JSON.stringify({ 
        verified: false,
        error: verificationResult.error || "Payment verification failed",
        details: {
          expected_recipient: expectedRecipient,
          expected_amount,
          recipient_source: recipientSource
        }
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const verified = true;
    console.log('✅ Blockchain verification successful:', verificationResult.details);

    // Record the verified payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        wallet_address: payment_wallet_address,
        tx_signature: tx_signature,
        payment_type: payment_type,
        amount_anime: expected_amount,
        amount_usdt: 0,
        anime_price: 1,
        verified: verified,
        collection_id: collection_id || null
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Payment recording error:', paymentError);
      
      // Check if duplicate signature (replay attack)
      if (paymentError.code === '23505') {
        await supabase.from('security_events').insert({
          event_type: 'payment_replay_attack_detected',
          severity: 'critical',
          user_id: user.id,
          wallet_address: payment_wallet_address,
          metadata: {
            tx_signature,
            payment_type,
            error: 'Duplicate transaction signature - possible replay attack'
          }
        });
        
        return new Response(JSON.stringify({ 
          error: "This transaction has already been used for payment" 
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      return new Response(JSON.stringify({ 
        error: "Failed to record payment" 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Log successful verification
    await supabase.from('security_events').insert({
      event_type: 'payment_verified',
      severity: 'info',
      user_id: user.id,
      wallet_address: payment_wallet_address,
      metadata: {
        payment_id: payment.id,
        tx_signature,
        payment_type,
        amount: expected_amount,
        recipient: expectedRecipient,
        recipient_source: recipientSource,
        blockchain_details: verificationResult.details,
        cluster
      }
    });

    console.log('✅ Payment verification complete:', {
      payment_id: payment.id,
      verified: true,
      blockchain_confirmed: true
    });
    
    return new Response(JSON.stringify({ 
      verified: true,
      payment_id: payment.id,
      receipt: {
        tx_signature: tx_signature,
        amount: expected_amount,
        payment_type: payment_type,
        recipient: expectedRecipient,
        verified_at: new Date().toISOString(),
        blockchain_details: verificationResult.details,
        solscan_url: `https://solscan.io/tx/${tx_signature}${cluster === 'devnet' ? '?cluster=devnet' : ''}`
      }
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('verify-payment unexpected error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
