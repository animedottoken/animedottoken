import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { toast } from 'sonner';

export interface StandaloneNFTData {
  name: string;
  symbol?: string;
  description?: string;
  image_file?: File;
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
  const { publicKey } = useSolanaWallet();

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `nft-media/${fileName}`;

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
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const mintStandaloneNFT = async (nftData: StandaloneNFTData) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }

    setMinting(true);
    
    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (nftData.image_file) {
        imageUrl = await uploadImage(nftData.image_file);
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
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
              signature: 'placeholder_signature', // Mock signature for now
              message: `mint_${Date.now()}`,
              nft_data: {
                name: nftData.name,
                symbol: nftData.symbol || 'NFT',
                description: nftData.description,
                image_url: imageUrl,
                category: nftData.category,
                royalty_percentage: nftData.royalty_percentage
              }
            }
          });

          if (error) {
            console.error('Mint job creation failed:', error);
            // Fall back to batch processing
            return await batchMintNFTs(nftData, quantity, imageUrl, publicKey);
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
          console.warn('Mint job failed, falling back to batch processing:', error);
          return await batchMintNFTs(nftData, quantity, imageUrl, publicKey);
        }
      }

      // For smaller quantities or standalone NFTs, use batch processing
      return await batchMintNFTs(nftData, quantity, imageUrl, publicKey);

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

  const batchMintNFTs = async (nftData: StandaloneNFTData, quantity: number, imageUrl: string | null, publicKey: string) => {
    const BATCH_SIZE = 50;
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
            explicit_content: nftData.explicit_content || false
          },
          traits: nftData.attributes || [], // Store structured traits with display_type
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