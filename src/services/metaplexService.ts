import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  createNft,
  fetchDigitalAsset,
  mplTokenMetadata
} from '@metaplex-foundation/mpl-token-metadata';
import { 
  generateSigner, 
  percentAmount, 
  publicKey, 
  some,
  none,
  Umi,
  Signer,
  TransactionBuilder,
  sol
} from '@metaplex-foundation/umi';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { toast } from 'sonner';

export interface MetaplexMintResult {
  success: boolean;
  signature?: string;
  mintAddress?: string;
  explorerUrl?: string;
  error?: string;
}

export interface CollectionMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  sellerFeeBasisPoints: number;
  creators?: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
  collection?: {
    name: string;
    family: string;
  };
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  animation_url?: string;
  sellerFeeBasisPoints: number;
  creators?: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
  collection?: {
    name: string;
    family: string;
    address?: string;
  };
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

class MetaplexService {
  private umi: Umi | null = null;
  private isDevnet = true; // Always use devnet for testing

  private getUmi(): Umi {
    if (!this.umi) {
      const endpoint = this.isDevnet 
        ? 'https://api.devnet.solana.com'
        : 'https://api.mainnet-beta.solana.com';
      
      this.umi = createUmi(endpoint).use(mplTokenMetadata());
    }
    return this.umi;
  }

  public setWallet(wallet: any) {
    if (wallet && wallet.adapter) {
      this.umi = this.getUmi().use(walletAdapterIdentity(wallet.adapter));
    }
  }

  public async createMetadataJson(metadata: CollectionMetadata | NFTMetadata): Promise<string> {
    // In a real implementation, this would upload to IPFS or Arweave
    // For testing, we'll use a mock metadata URL
    const mockMetadataHash = Math.random().toString(36).substr(2, 9);
    return `https://devnet-metadata.mockapi.com/${mockMetadataHash}.json`;
  }

  public async mintCollection(params: {
    metadata: CollectionMetadata;
    creatorWallet: string;
  }): Promise<MetaplexMintResult> {
    try {
      const umi = this.getUmi();
      
      // Generate a new mint for the collection
      const collectionMint = generateSigner(umi);
      
      // Create metadata URI
      const metadataUri = await this.createMetadataJson(params.metadata);
      
      // Create the collection NFT
      const createCollectionTx = createNft(umi, {
        mint: collectionMint,
        name: params.metadata.name,
        symbol: params.metadata.symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(params.metadata.sellerFeeBasisPoints),
        isCollection: true,
        creators: params.metadata.creators ? some(params.metadata.creators.map(creator => ({
          address: publicKey(creator.address),
          verified: creator.verified,
          share: creator.share,
        }))) : none(),
      });

      // Send transaction
      const result = await createCollectionTx.sendAndConfirm(umi);
      const signature = String(result.signature);
      
      const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      
      return {
        success: true,
        signature,
        mintAddress: collectionMint.publicKey,
        explorerUrl,
      };
    } catch (error: any) {
      console.error('Collection minting error:', error);
      return {
        success: false,
        error: error.message || 'Failed to mint collection',
      };
    }
  }

  public async mintNFT(params: {
    metadata: NFTMetadata;
    creatorWallet: string;
    collectionMint?: string;
  }): Promise<MetaplexMintResult> {
    try {
      const umi = this.getUmi();
      
      // Generate a new mint for the NFT
      const nftMint = generateSigner(umi);
      
      // Create metadata URI
      const metadataUri = await this.createMetadataJson(params.metadata);
      
      // Create the NFT
      const createNftTx = createNft(umi, {
        mint: nftMint,
        name: params.metadata.name,
        symbol: params.metadata.symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(params.metadata.sellerFeeBasisPoints),
        creators: params.metadata.creators ? some(params.metadata.creators.map(creator => ({
          address: publicKey(creator.address),
          verified: creator.verified,
          share: creator.share,
        }))) : none(),
        collection: params.collectionMint ? some({ 
          verified: false, 
          key: publicKey(params.collectionMint) 
        }) : none(),
      });

      // Send transaction
      const result = await createNftTx.sendAndConfirm(umi);
      const signature = String(result.signature);
      
      const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      
      return {
        success: true,
        signature,
        mintAddress: nftMint.publicKey,
        explorerUrl,
      };
    } catch (error: any) {
      console.error('NFT minting error:', error);
      return {
        success: false,
        error: error.message || 'Failed to mint NFT',
      };
    }
  }

  public async requestAirdrop(walletAddress: string): Promise<{success: boolean; signature?: string; error?: string}> {
    try {
      // Use the devnet helpers for airdrop since UMI RPC doesn't have airdrop
      const { requestDevnetAirdrop } = await import('@/services/devnetHelpers');
      return await requestDevnetAirdrop(walletAddress);
    } catch (error: any) {
      console.error('Airdrop error:', error);
      return {
        success: false,
        error: error.message || 'Airdrop failed',
      };
    }
  }
}

export const metaplexService = new MetaplexService();