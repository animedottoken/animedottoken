import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Connection, LAMPORTS_PER_SOL } from "https://esm.sh/@solana/web3.js@^1.98.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Account sizes for typical collection NFT creation
const ACCOUNT_SIZES = {
  MINT: 82,
  ASSOCIATED_TOKEN: 165,
  METADATA: 679,
  MASTER_EDITION: 282,
};

// Conservative compute unit estimate for collection minting
const COMPUTE_UNITS = 200_000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Get mint fee request - calculating real-time fees');

    // Use RPC endpoint from env or fallback to public mainnet
    const rpcUrl = Deno.env.get("SOLANA_RPC_URL") || "https://api.mainnet-beta.solana.com";
    
    let feeEstimate;
    let degraded = false;

    try {
      const connection = new Connection(rpcUrl, 'confirmed');

      // Calculate rent-exempt amounts for each account
      const rentMint = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZES.MINT);
      const rentAta = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZES.ASSOCIATED_TOKEN);
      const rentMetadata = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZES.METADATA);
      const rentMasterEdition = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZES.MASTER_EDITION);

      // Get recent blockhash for base fee calculation
      const { feeCalculator } = await connection.getRecentBlockhash();
      const baseTxFee = feeCalculator.lamportsPerSignature * 2; // Assume 2 signatures typical

      // Get priority fees (median of last 20 blocks)
      let priorityFee = 0;
      try {
        const priorityFees = await connection.getRecentPrioritizationFees();
        if (priorityFees.length > 0) {
          const medianFee = priorityFees[Math.floor(priorityFees.length / 2)];
          priorityFee = (medianFee.prioritizationFee || 0) * COMPUTE_UNITS / 1_000_000; // Convert microlamports/CU to lamports
        }
      } catch (e) {
        console.warn('Could not fetch priority fees:', e);
      }

      const totalLamports = rentMint + rentAta + rentMetadata + rentMasterEdition + baseTxFee + priorityFee;
      const totalSol = totalLamports / LAMPORTS_PER_SOL;

      // Try to fetch SOL/USD price
      let approxUsd;
      try {
        const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
          headers: { 'Accept': 'application/json' }
        });
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          const solPrice = priceData?.solana?.usd;
          if (solPrice) {
            approxUsd = totalSol * solPrice;
          }
        }
      } catch (e) {
        console.warn('Could not fetch SOL price:', e);
      }

      feeEstimate = {
        totalSol,
        totalLamports,
        approxUsd,
        currency: "SOL",
        degraded: false,
        breakdown: [
          {
            key: "rentMint",
            description: "Mint account rent",
            lamports: rentMint,
            sol: rentMint / LAMPORTS_PER_SOL
          },
          {
            key: "rentAta",
            description: "Token account rent",
            lamports: rentAta,
            sol: rentAta / LAMPORTS_PER_SOL
          },
          {
            key: "rentMetadata",
            description: "Metadata account rent",
            lamports: rentMetadata,
            sol: rentMetadata / LAMPORTS_PER_SOL
          },
          {
            key: "rentMasterEdition",
            description: "Master edition rent",
            lamports: rentMasterEdition,
            sol: rentMasterEdition / LAMPORTS_PER_SOL
          },
          {
            key: "baseTxFee",
            description: "Base transaction fee",
            lamports: baseTxFee,
            sol: baseTxFee / LAMPORTS_PER_SOL
          },
          {
            key: "priorityFee",
            description: "Priority fee estimate",
            lamports: priorityFee,
            sol: priorityFee / LAMPORTS_PER_SOL
          }
        ]
      };

    } catch (rpcError) {
      console.warn('RPC call failed, using conservative estimate:', rpcError);
      degraded = true;
      
      // Conservative fallback estimate
      const conservativeLamports = 15_000_000; // ~0.015 SOL
      feeEstimate = {
        totalSol: conservativeLamports / LAMPORTS_PER_SOL,
        totalLamports: conservativeLamports,
        currency: "SOL",
        degraded: true,
        breakdown: [
          {
            key: "conservative", 
            description: "Conservative estimate (network unavailable)",
            lamports: conservativeLamports,
            sol: conservativeLamports / LAMPORTS_PER_SOL
          }
        ]
      };
    }

    console.log('Fee estimate:', feeEstimate);

    return new Response(
      JSON.stringify({ 
        success: true, 
        feeEstimate
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to calculate mint fee' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});