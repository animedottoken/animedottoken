import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { metaplexService, type NFTMetadata } from '@/services/metaplexService';
import { uploadMetadataToStorage, createExplorerUrl } from '@/services/devnetHelpers';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { toast } from 'sonner';

const BATCH_SIZE = 50;

export interface StandaloneNFTData {
  name: string;
  symbol?: string;
  description?: string;
  image_file?: File; // For backwards compatibility (image only)
  media_file?: File; // Primary media: image, video, audio, or 3D
  cover_image_file?: File; // Optional cover/thumbnail for video/audio
  quantity?: number;
  royalty_percentage?: number;
  category?: string;
  external_links?: { type: string; url: string }[];
  attributes?: { trait_type: string; value: string; display_type?: string }[];
  collection_id?: string; // Optional: assign to existing collection
  explicit_content?: boolean;
  list_after_mint?: boolean;
  initial_price?: number;
}

export const useStandaloneMint = () => {
  const [minting, setMinting] = useState(false);
  const { publicKey, wallet } = useSolanaWallet();
  const { cluster } = useEnvironment();

  const uploadFile = async (file: File, prefix: string = 'nft-media'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${prefix}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('nft-media')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('nft-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  // Backwards compatibility
  const uploadImage = uploadFile;

  const mintStandaloneNFT = async (nftData: StandaloneNFTData) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }
    setMinting(true);
    
    try {
      let imageUrl = null;
      let mediaUrl = null;
      let mediaType = '';
      
      // Handle media uploads
      const primaryFile = nftData.media_file || nftData.image_file;
      
      if (primaryFile) {
        mediaUrl = await uploadFile(primaryFile, 'nft-media');
        mediaType = primaryFile.type;
        if (!mediaUrl) {
          throw new Error('Failed to upload primary media');
        }
        
        // For images and GIFs, use as cover too
        if (primaryFile.type.startsWith('image/')) {
          imageUrl = mediaUrl;
        }
      }
      
      // Handle cover image upload for video/audio
      if (nftData.cover_image_file) {
        imageUrl = await uploadFile(nftData.cover_image_file, 'nft-covers');
        if (!imageUrl) {
          console.warn('Failed to upload cover image, continuing without cover');
        }
      }
      
      // Backwards compatibility: if only image_file provided
      if (nftData.image_file && !nftData.media_file) {
        mediaUrl = imageUrl;
        mediaType = nftData.image_file.type;
      }

      // Ensure cover image is present for all mints
      if (!imageUrl) {
        throw new Error('Cover image is required. Please upload a cover image.');
      }

      const quantity = nftData.quantity || 1;

      // For large quantities with a collection, use the mint job system
      if (quantity > 100 && nftData.collection_id) {
        try {
          const { data, error } = await supabase.functions.invoke('create-mint-job', {
            body: {
              collection_id: nftData.collection_id,
              quantity,
              wallet_address: publicKey,
              signature: 'placeholder_signature',
              message: `mint_${Date.now()}`,
              nft_data: {
                name: nftData.name,
                symbol: nftData.symbol || 'NFT',
                description: nftData.description,
                image_url: imageUrl,
                media_url: mediaUrl,
                media_type: mediaType,
                category: nftData.category,
                royalty_percentage: nftData.royalty_percentage
              }
            }
          });

          if (error) {
            console.error('Mint job creation failed:', error);
            return await batchMintNFTs(nftData, quantity, imageUrl, mediaUrl, mediaType, publicKey);
          }

          toast.success(`Mint job created successfully! 🎉`, {
            description: `${quantity} NFTs queued for background processing`
          });

          return { 
            success: true, 
            job_id: data?.job_id,
            count: quantity,
            queued: true
          };
        } catch (error) {
          console.warn('Mint job failed, falling back to real minting:', error);
          return await realMintNFTs(nftData, quantity, imageUrl, mediaUrl, mediaType, publicKey);
        }
      }

      // For smaller quantities or standalone NFTs, use real on-chain minting
      return await realMintNFTs(nftData, quantity, imageUrl, mediaUrl, mediaType, publicKey);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Minting failed', {
        description: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setMinting(false);
    }
  };

  const realMintNFTs = async (nftData: StandaloneNFTData, quantity: number, imageUrl: string | null, mediaUrl: string | null, mediaType: string, publicKey: string) => {
    const results = [];
    
    // Set cluster and wallet for Metaplex
    metaplexService.setCluster(cluster);
    if (wallet) {
      metaplexService.setWallet(wallet);
    }
    
    // For real on-chain minting with Metaplex
    for (let i = 0; i < quantity; i++) {
      const nftName = quantity > 1 ? `${nftData.name} #${i + 1}` : nftData.name;
      
      try {
        // Prepare NFT metadata for Metaplex
        const nftMetadata: NFTMetadata = {
          name: nftName,
          symbol: nftData.symbol || 'NFT',
          description: nftData.description || '',
          image: imageUrl || '',
          animation_url: (mediaUrl && mediaUrl !== imageUrl) ? mediaUrl : undefined,
          sellerFeeBasisPoints: Math.round((nftData.royalty_percentage || 0) * 100),
          creators: [{
            address: publicKey,
            verified: true,
            share: 100,
          }],
          attributes: (nftData.attributes || []).map(attr => ({
            trait_type: attr.trait_type,
            value: attr.value,
          })),
        };
        
        // Upload metadata to storage
        const metadataUri = await uploadMetadataToStorage(nftMetadata, 'nft', nftName);
        
        // Mint on-chain with Metaplex
        const mintResult = await metaplexService.mintNFT({
          metadata: { ...nftMetadata, image: metadataUri },
          creatorWallet: publicKey,
          collectionMint: nftData.collection_id,
        });
        
        if (mintResult.success) {
          // Store NFT data in database
          const { data: nftRecord, error: dbError } = await supabase
            .from('nfts')
            .insert({
              name: nftName,
              symbol: nftData.symbol || 'NFT',
              description: nftData.description || '',
              mint_address: mintResult.mintAddress,
              owner_address: publicKey,
              creator_address: publicKey,
              collection_id: nftData.collection_id || null,
              image_url: imageUrl,
              metadata_uri: metadataUri,
              attributes: {
                ...Object.fromEntries((nftData.attributes || []).map(attr => [attr.trait_type, attr.value])),
                minted_at: new Date().toISOString(),
                transaction_signature: mintResult.signature,
                explorer_url: mintResult.explorerUrl,
                ...(mediaUrl && mediaUrl !== imageUrl && {
                  animation_url: mediaUrl,
                  media_type: mediaType,
                  has_media: true
                })
              },
              is_listed: nftData.list_after_mint || false,
              price: nftData.list_after_mint ? nftData.initial_price : null
            })
            .select()
            .single();
          
          if (dbError) {
            console.error('Database insert error:', dbError);
          } else {
            results.push(nftRecord);
          }
          
          // Show progress for multiple NFTs
          if (quantity > 1) {
            toast.info(`Minted ${i + 1}/${quantity} NFTs`, {
              description: `Transaction: ${mintResult.signature?.slice(0, 8)}...`,
            });
          }
        } else {
          throw new Error(mintResult.error || 'Mint failed');
        }
      } catch (error) {
        console.error(`Failed to mint NFT ${i + 1}:`, error);
        toast.error(`Failed to mint NFT ${i + 1}`, {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        break; // Stop on first failure
      }
    }
    
    if (results.length > 0) {
      toast.success(`Successfully minted ${results.length} NFT${results.length > 1 ? 's' : ''} on Solana ${cluster === 'mainnet' ? 'Mainnet' : 'Devnet'}! 🎉`);
    }
    
    return { 
      success: results.length > 0, 
      nfts: results,
      count: results.length
    };
  };

  const batchMintNFTs = async (nftData: StandaloneNFTData, quantity: number, imageUrl: string | null, mediaUrl: string | null, mediaType: string, publicKey: string) => {
    const results = [];
    
    // Prepare all NFT data first
    const nftBatches = [];
    for (let i = 0; i < quantity; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, quantity);
      const batch = [];
      
      for (let j = i; j < batchEnd; j++) {
        const nftName = quantity > 1 ? `${nftData.name} #${j + 1}` : nftData.name;
        const mockMintAddress = `MINT${Date.now()}_${j}_${Math.random().toString(36).substr(2, 9)}`;
        
        batch.push({
          name: nftName,
          symbol: nftData.symbol || 'NFT',
          description: nftData.description || '',
          mint_address: mockMintAddress,
          owner_address: publicKey,
          creator_address: publicKey,
          collection_id: nftData.collection_id || null,
          image_url: imageUrl,
          metadata_uri: `https://metadata.example.com/${mockMintAddress}.json`,
          attributes: {
            ...Object.fromEntries((nftData.attributes || []).map(attr => [attr.trait_type, attr.value])),
            minted_at: new Date().toISOString(),
            standalone: true,
            quantity_index: j + 1,
            total_quantity: quantity,
            explicit_content: nftData.explicit_content ?? false,
            category: nftData.category || "Other",
            royalty_percentage: nftData.royalty_percentage ?? 0,
            ...(mediaUrl && mediaUrl !== imageUrl && {
              animation_url: mediaUrl,
              media_type: mediaType,
              has_media: true
            })
          },
          // Note: traits column removed - using attributes instead
          is_listed: nftData.list_after_mint || false,
          price: nftData.list_after_mint ? nftData.initial_price : null
        });
      }
      nftBatches.push(batch);
    }

    // Process batches
    let processedCount = 0;
    for (let batchIndex = 0; batchIndex < nftBatches.length; batchIndex++) {
      const batch = nftBatches[batchIndex];
      
      try {
        const { data: batchResults, error: batchError } = await supabase
          .from('nfts')
          .insert(batch)
          .select();

        if (batchError) {
          console.error(`Batch ${batchIndex + 1} failed:`, batchError);
          throw new Error(`Batch ${batchIndex + 1} failed: ${batchError.message}`);
        }

        results.push(...(batchResults || []));
        processedCount += batch.length;

        // Show progress for larger quantities
        if (quantity > 50 && batchIndex < nftBatches.length - 1) {
          toast.info(`Progress: ${processedCount}/${quantity} NFTs processed`, {
            duration: 2000
          });
        }
      } catch (error) {
        console.error(`Batch ${batchIndex + 1} error:`, error);
        throw error;
      }
    }

    toast.success(`Successfully minted ${quantity} NFT${quantity > 1 ? 's' : ''}! 🎉`, {
      description: `${results.length} NFT${results.length > 1 ? 's' : ''} created successfully`
    });

    return { 
      success: true, 
      nfts: results,
      count: results.length
    };
  };

  return {
    minting,
    mintStandaloneNFT
  };
};