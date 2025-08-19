import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { toast } from 'sonner';

export interface Collection {
  id: string;
  name: string;
  symbol?: string;
  description?: string;
  image_url?: string;
  banner_image_url?: string;
  creator_address: string;
  treasury_wallet?: string;
  mint_price?: number;
  max_supply?: number;
  items_available?: number;
  items_redeemed?: number;
  royalty_percentage?: number;
  is_active: boolean;
  is_live: boolean;
  whitelist_enabled: boolean;
  go_live_date?: string | null;
  created_at: string;
  updated_at: string;
  candy_machine_id?: string;
  slug?: string;
  external_links?: any;
  collection_mint_address?: string;
  verified?: boolean;
  category?: string;
  explicit_content?: boolean;
}

export interface CreateCollectionData {
  name: string;
  symbol?: string;
  description?: string;
  image_file?: File;
  banner_file?: File;
  external_links?: { type: string; url: string }[];
  category?: string;
  explicit_content?: boolean;
  // Advanced settings (for primary sales)
  enable_primary_sales?: boolean;
  mint_price?: number;
  max_supply?: number;
  royalty_percentage?: number;
  treasury_wallet?: string;
  whitelist_enabled?: boolean;
  go_live_date?: string;
}

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { publicKey } = useSolanaWallet();

  // Load user's collections
  const loadCollections = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('creator_address', publicKey)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading collections:', error);
        toast.error('Failed to load collections');
        return;
      }

      setCollections((data || []) as Collection[]);
    } catch (error) {
      console.error('Unexpected error loading collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // Upload collection images to storage
  const uploadCollectionImage = async (file: File, collectionId: string, type: 'avatar' | 'banner' = 'avatar'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${collectionId}-${type}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('collection-images')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('collection-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Create new collection
  const createCollection = async (collectionData: CreateCollectionData) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return { success: false };
    }

    setCreating(true);
    try {
      // Generate collection ID
      const collectionId = crypto.randomUUID();
      
      let imageUrl = null;
      let bannerUrl = null;

      // Upload avatar if provided
      if (collectionData.image_file) {
        const uploadedUrl = await uploadCollectionImage(collectionData.image_file, collectionId, 'avatar');
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload collection avatar');
          return { success: false };
        }
      }

      // Upload banner if provided
      if (collectionData.banner_file) {
        const uploadedBannerUrl = await uploadCollectionImage(collectionData.banner_file, collectionId, 'banner');
        if (uploadedBannerUrl) {
          bannerUrl = uploadedBannerUrl;
        }
      }

      // Create collection record
      const newCollection = {
        id: collectionId,
        name: collectionData.name,
        symbol: collectionData.symbol || null,
        description: collectionData.description || null,
        image_url: imageUrl,
        banner_image_url: bannerUrl,
        creator_address: publicKey,
        external_links: collectionData.external_links || [],
        category: collectionData.category || null,
        explicit_content: collectionData.explicit_content || false,
        is_active: true,
        is_live: false,
        verified: false,
        // Only set primary sales fields if enabled
        ...(collectionData.enable_primary_sales && {
          treasury_wallet: collectionData.treasury_wallet || publicKey,
          mint_price: collectionData.mint_price || 0,
          max_supply: collectionData.max_supply || 1000,
          items_available: collectionData.max_supply || 1000,
          items_redeemed: 0,
          royalty_percentage: collectionData.royalty_percentage || 0,
          whitelist_enabled: collectionData.whitelist_enabled || false,
          go_live_date: collectionData.go_live_date || null,
        }),
      };

      const { data, error } = await supabase
        .from('collections')
        .insert(newCollection)
        .select()
        .single();

      if (error) {
        console.error('Error creating collection:', error);
        toast.error('Failed to create collection');
        return { success: false };
      }

      // Refresh collections
      await loadCollections();

      toast.success(`Collection "${collectionData.name}" created successfully!`);
      return { success: true, collection: data };

    } catch (error) {
      console.error('Unexpected error creating collection:', error);
      toast.error('Failed to create collection');
      return { success: false };
    } finally {
      setCreating(false);
    }
  };

  // Update collection status
  const updateCollectionStatus = async (collectionId: string, updates: Partial<Collection>) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', collectionId)
        .eq('creator_address', publicKey);

      if (error) {
        console.error('Error updating collection:', error);
        toast.error('Failed to update collection');
        return false;
      }

      await loadCollections();
      toast.success('Collection updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection');
      return false;
    }
  };

  // Load collections on wallet connection
  useEffect(() => {
    if (publicKey) {
      loadCollections();
    } else {
      setCollections([]);
    }
  }, [publicKey, loadCollections]);

  return {
    collections,
    loading,
    creating,
    createCollection,
    updateCollectionStatus,
    refreshCollections: loadCollections
  };
};