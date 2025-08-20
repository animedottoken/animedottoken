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
  attributes?: { trait_type: string; value: string }[];
  collection_id?: string; // Optional: assign to existing collection
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
      const results = [];

      // Mint multiple NFTs if quantity > 1
      for (let i = 0; i < quantity; i++) {
        // Generate unique NFT metadata
        const nftName = quantity > 1 ? `${nftData.name} #${i + 1}` : nftData.name;
        const mockMintAddress = `MINT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert NFT into database
        const { data: nft, error: nftError } = await supabase
          .from('nfts')
          .insert({
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
              quantity_index: i + 1,
              total_quantity: quantity
            },
            is_listed: false,
            price: null
          })
          .select()
          .single();

        if (nftError) {
          console.error(`Failed to create NFT ${i + 1}:`, nftError);
          throw new Error(`Failed to create NFT ${i + 1}: ${nftError.message}`);
        }

        results.push(nft);
      }

      toast.success(`Successfully minted ${quantity} NFT${quantity > 1 ? 's' : ''}! 🎉`, {
        description: `${results.length} NFT${results.length > 1 ? 's' : ''} created successfully`
      });

      return { 
        success: true, 
        nfts: results,
        count: results.length
      };

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

  return {
    minting,
    mintStandaloneNFT
  };
};