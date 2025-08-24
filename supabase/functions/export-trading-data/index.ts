import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set the auth token for this request
    supabaseClient.auth.setAuth(authHeader.replace('Bearer ', ''));

    const { wallet_address, format = 'json' } = await req.json()

    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Exporting trading data for wallet: ${wallet_address}`);

    // 1. Get marketplace activities (buy/sell transactions)
    const { data: marketplaceActivities, error: activitiesError } = await supabaseClient
      .from('marketplace_activities')
      .select(`
        *,
        nfts:nft_id (
          name,
          image_url,
          mint_address,
          collections:collection_id (
            name,
            symbol
          )
        )
      `)
      .or(`from_address.eq.${wallet_address},to_address.eq.${wallet_address}`)
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('Error fetching marketplace activities:', activitiesError);
    }

    // 2. Get mint jobs (minting history)
    const { data: mintJobs, error: mintJobsError } = await supabaseClient
      .from('mint_jobs')
      .select(`
        *,
        collections:collection_id (
          name,
          symbol,
          image_url
        )
      `)
      .eq('wallet_address', wallet_address)
      .order('created_at', { ascending: false });

    if (mintJobsError) {
      console.error('Error fetching mint jobs:', mintJobsError);
    }

    // 3. Get owned NFTs
    const { data: ownedNFTs, error: nftsError } = await supabaseClient
      .from('nfts')
      .select(`
        *,
        collections:collection_id (
          name,
          symbol
        )
      `)
      .eq('owner_address', wallet_address)
      .order('created_at', { ascending: false });

    if (nftsError) {
      console.error('Error fetching owned NFTs:', nftsError);
    }

    // 4. Get boosted listings
    const { data: boostedListings, error: boostedError } = await supabaseClient
      .from('boosted_listings')
      .select(`
        *,
        nfts:nft_id (
          name,
          image_url,
          mint_address,
          collections:collection_id (
            name,
            symbol
          )
        )
      `)
      .eq('bidder_wallet', wallet_address)
      .order('created_at', { ascending: false });

    if (boostedError) {
      console.error('Error fetching boosted listings:', boostedError);
    }

    // 5. Get created collections
    const { data: createdCollections, error: collectionsError } = await supabaseClient
      .from('collections')
      .select('*')
      .eq('creator_address', wallet_address)
      .order('created_at', { ascending: false });

    if (collectionsError) {
      console.error('Error fetching created collections:', collectionsError);
    }

    // 6. Get NFT likes
    const { data: nftLikes, error: nftLikesError } = await supabaseClient
      .from('nft_likes')
      .select(`
        *,
        nfts:nft_id (
          name,
          image_url,
          mint_address,
          collections:collection_id (
            name,
            symbol
          )
        )
      `)
      .eq('user_wallet', wallet_address)
      .order('created_at', { ascending: false });

    if (nftLikesError) {
      console.error('Error fetching NFT likes:', nftLikesError);
    }

    // 7. Get collection likes
    const { data: collectionLikes, error: collectionLikesError } = await supabaseClient
      .from('collection_likes')
      .select(`
        *,
        collections:collection_id (
          name,
          symbol,
          image_url,
          creator_address
        )
      `)
      .eq('user_wallet', wallet_address)
      .order('created_at', { ascending: false });

    if (collectionLikesError) {
      console.error('Error fetching collection likes:', collectionLikesError);
    }

    // Compile all data
    const exportData = {
      wallet_address,
      export_date: new Date().toISOString(),
      summary: {
        marketplace_activities_count: marketplaceActivities?.length || 0,
        mint_jobs_count: mintJobs?.length || 0,
        owned_nfts_count: ownedNFTs?.length || 0,
        boosted_listings_count: boostedListings?.length || 0,
        created_collections_count: createdCollections?.length || 0,
        nft_likes_count: nftLikes?.length || 0,
        collection_likes_count: collectionLikes?.length || 0,
      },
      data: {
        marketplace_activities: marketplaceActivities || [],
        mint_jobs: mintJobs || [],
        owned_nfts: ownedNFTs || [],
        boosted_listings: boostedListings || [],
        created_collections: createdCollections || [],
        nft_likes: nftLikes || [],
        collection_likes: collectionLikes || [],
      }
    };

    // Calculate total trade volume
    const totalBuyVolume = marketplaceActivities?.filter(a => a.to_address === wallet_address)
      .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0) || 0;
    
    const totalSellVolume = marketplaceActivities?.filter(a => a.from_address === wallet_address)
      .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0) || 0;

    const totalMintCost = mintJobs?.reduce((sum, job) => sum + (parseFloat(job.total_cost) || 0), 0) || 0;

    exportData.summary = {
      ...exportData.summary,
      total_buy_volume_sol: totalBuyVolume,
      total_sell_volume_sol: totalSellVolume,
      total_mint_cost_sol: totalMintCost,
      net_trading_volume_sol: totalSellVolume - totalBuyVolume,
    };

    console.log(`Export completed for ${wallet_address}:`, exportData.summary);

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData);
      return new Response(csvData, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="trading-data-${wallet_address.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="trading-data-${wallet_address.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('Error in export-trading-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function convertToCSV(data: any): string {
  const lines: string[] = [];
  
  // Add header with summary
  lines.push('TRADING DATA EXPORT');
  lines.push(`Wallet Address: ${data.wallet_address}`);
  lines.push(`Export Date: ${data.export_date}`);
  lines.push('');
  
  // Add summary section
  lines.push('SUMMARY');
  Object.entries(data.summary).forEach(([key, value]) => {
    lines.push(`${key}: ${value}`);
  });
  lines.push('');
  
  // Add marketplace activities
  if (data.data.marketplace_activities.length > 0) {
    lines.push('MARKETPLACE ACTIVITIES');
    lines.push('Date,Type,NFT Name,Collection,From Address,To Address,Price,Currency,Transaction');
    data.data.marketplace_activities.forEach((activity: any) => {
      const nft = activity.nfts || {};
      const collection = nft.collections || {};
      lines.push([
        activity.block_time || activity.created_at,
        activity.activity_type,
        `"${nft.name || 'Unknown'}"`,
        `"${collection.name || 'Unknown'}"`,
        activity.from_address || '',
        activity.to_address || '',
        activity.price || 0,
        activity.currency || 'SOL',
        activity.transaction_signature || ''
      ].join(','));
    });
    lines.push('');
  }
  
  // Add mint jobs
  if (data.data.mint_jobs.length > 0) {
    lines.push('MINTING HISTORY');
    lines.push('Date,Collection,Quantity,Cost,Status,Completed,Failed');
    data.data.mint_jobs.forEach((job: any) => {
      const collection = job.collections || {};
      lines.push([
        job.created_at,
        `"${collection.name || 'Unknown'}"`,
        job.total_quantity,
        job.total_cost,
        job.status,
        job.completed_quantity,
        job.failed_quantity
      ].join(','));
    });
    lines.push('');
  }
  
  return lines.join('\n');
}