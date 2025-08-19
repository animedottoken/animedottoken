import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';
import { supabase } from '@/integrations/supabase/client';

export class SolanaService {
  private connection: Connection;
  private network: string;

  constructor() {
    // Use mainnet for production, devnet for development
    this.network = import.meta.env.MODE === 'production' ? 'mainnet-beta' : 'devnet';
    const endpoint = this.network === 'mainnet-beta' 
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com';
    
    this.connection = new Connection(endpoint, 'confirmed');
  }

  async getConnection() {
    return this.connection;
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubkey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  async mintNFT(params: {
    walletAddress: string;
    collectionId: string;
    payerSignature: any;
  }): Promise<{ success: boolean; signature?: string; error?: string; nftAddress?: string }> {
    try {
      const { walletAddress, collectionId, payerSignature } = params;

      // Get collection details
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (collectionError || !collection) {
        return { success: false, error: 'Collection not found' };
      }

      // Check if collection is live and has supply
      if (!collection.is_live) {
        return { success: false, error: 'Collection is not live yet' };
      }

      if (collection.items_redeemed >= collection.items_available) {
        return { success: false, error: 'Collection is sold out' };
      }

      // Check whitelist if enabled
      if (collection.whitelist_enabled) {
        const { data: whitelist } = await supabase
          .from('collection_whitelist')
          .select('*')
          .eq('collection_id', collectionId)
          .eq('wallet_address', walletAddress)
          .single();

        if (!whitelist) {
          return { success: false, error: 'Wallet not whitelisted' };
        }

        if (whitelist.minted_count >= whitelist.max_mint_count) {
          return { success: false, error: 'Whitelist allocation exceeded' };
        }
      }

      // Generate unique NFT metadata
      const nftNumber = collection.items_redeemed + 1;
      const nftName = `${collection.name} #${nftNumber}`;
      const nftSymbol = collection.symbol;
      
      // Create mock mint address (in real implementation, this would be from Candy Machine)
      const mockMintAddress = Keypair.generate().publicKey.toString();

      // Create NFT record in database
      const { data: nft, error: nftError } = await supabase
        .from('nfts')
        .insert({
          name: nftName,
          symbol: nftSymbol,
          description: `${collection.description} - Unique NFT #${nftNumber}`,
          image_url: collection.image_url,
          mint_address: mockMintAddress,
          owner_address: walletAddress,
          creator_address: collection.creator_address,
          collection_id: collectionId,
          attributes: {
            edition: nftNumber,
            rarity: this.generateRarity(),
            collection: collection.name
          }
        })
        .select()
        .single();

      if (nftError) {
        return { success: false, error: 'Failed to create NFT record' };
      }

      // Update collection stats
      await supabase
        .from('collections')
        .update({ 
          items_redeemed: collection.items_redeemed + 1 
        })
        .eq('id', collectionId);

      // Update whitelist if applicable
      if (collection.whitelist_enabled) {
        const { data: currentWhitelist } = await supabase
          .from('collection_whitelist')
          .select('minted_count')
          .eq('collection_id', collectionId)
          .eq('wallet_address', walletAddress)
          .single();

        if (currentWhitelist) {
          await supabase
            .from('collection_whitelist')
            .update({ 
              minted_count: currentWhitelist.minted_count + 1
            })
            .eq('collection_id', collectionId)
            .eq('wallet_address', walletAddress);
        }
      }

      // Record marketplace activity
      await supabase
        .from('marketplace_activities')
        .insert({
          activity_type: 'mint',
          nft_id: nft.id,
          collection_id: collectionId,
          to_address: walletAddress,
          price: collection.mint_price,
          currency: 'SOL',
          transaction_signature: mockMintAddress // In real implementation, use actual tx signature
        });

      return { 
        success: true, 
        signature: mockMintAddress,
        nftAddress: mockMintAddress 
      };

    } catch (error) {
      console.error('Mint error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  private generateRarity(): string {
    const rand = Math.random();
    if (rand < 0.01) return 'Legendary';
    if (rand < 0.05) return 'Epic';
    if (rand < 0.15) return 'Rare';
    if (rand < 0.35) return 'Uncommon';
    return 'Common';
  }

  async createCollection(params: {
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
    maxSupply: number;
    mintPrice: number;
    creatorAddress: string;
    treasuryWallet: string;
    royaltyPercentage: number;
    goLiveDate?: Date;
    whitelistEnabled?: boolean;
  }) {
    try {
      const { data: collection, error } = await supabase
        .from('collections')
        .insert({
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          image_url: params.imageUrl,
          max_supply: params.maxSupply,
          items_available: params.maxSupply,
          mint_price: params.mintPrice,
          creator_address: params.creatorAddress,
          treasury_wallet: params.treasuryWallet,
          royalty_percentage: params.royaltyPercentage,
          go_live_date: params.goLiveDate?.toISOString(),
          whitelist_enabled: params.whitelistEnabled || false,
          is_active: true,
          is_live: !params.goLiveDate || params.goLiveDate <= new Date()
        })
        .select()
        .single();

      return { success: true, collection };
    } catch (error) {
      console.error('Collection creation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCollectionStats(collectionId: string) {
    try {
      const { data: collection } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      const { data: activities } = await supabase
        .from('marketplace_activities')
        .select('price')
        .eq('collection_id', collectionId)
        .eq('activity_type', 'sale')
        .order('created_at', { ascending: false })
        .limit(100);

      const prices = activities?.map(a => Number(a.price)).filter(p => p > 0) || [];
      const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const totalVolume = prices.reduce((sum, price) => sum + price, 0);

      return {
        collection,
        floorPrice,
        totalVolume,
        totalSales: prices.length
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return null;
    }
  }
}

export const solanaService = new SolanaService();