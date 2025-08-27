import { supabase } from '@/integrations/supabase/client';

export class MockSolanaService {
  getNetwork() {
    return 'devnet';
  }

  getConnection() {
    return null; // Mock connection
  }

  async getBalance(publicKey: string): Promise<number> {
    // Return mock balance
    return 1.5;
  }

  async mintNFT(params: {
    walletAddress: string;
    collectionId: string;
    payerSignature: any;
  }): Promise<{ success: boolean; signature?: string; error?: string; nftAddress?: string }> {
    try {
      // Simulate minting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful mint
      const mockSignature = 'mock_signature_' + Date.now();
      const mockNftAddress = 'mock_nft_' + Date.now();
      
      return {
        success: true,
        signature: mockSignature,
        nftAddress: mockNftAddress
      };
    } catch (error) {
      return {
        success: false,
        error: 'Mock minting failed'
      };
    }
  }

  async airdrop(publicKeyString: string, amount: number = 1): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      // Simulate airdrop delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        signature: 'mock_airdrop_' + Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Mock airdrop failed'
      };
    }
  }

  async createCollection(params: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    walletAddress: string;
  }): Promise<{ success: boolean; collection?: any; error?: string }> {
    try {
      // Create collection in database without blockchain interaction
      const { data, error } = await supabase.functions.invoke('create-collection', {
        body: {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          image: params.image,
          wallet_address: params.walletAddress,
          mint_address: 'mock_collection_' + Date.now()
        }
      });

      if (error) throw error;

      return { success: true, collection: data };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create mock collection'
      };
    }
  }

  async getCollectionStats(collectionId: string) {
    try {
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (collectionError) throw collectionError;

      // Return mock stats
      return {
        collection,
        floorPrice: 0.1,
        totalVolume: 10.5,
        totalSales: 25
      };
    } catch (error) {
      throw error;
    }
  }
}

export const solanaService = new MockSolanaService();