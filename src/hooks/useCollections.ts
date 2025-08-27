
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { toast } from 'sonner';
import type { Collection, CreateCollectionData } from '@/types/collection';

export type { Collection, CreateCollectionData };

export const useCollections = (options: { autoLoad?: boolean; suppressErrors?: boolean } = {}) => {
  const { autoLoad = true, suppressErrors = false } = options;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { publicKey } = useSolanaWallet();

  // Load user's collections
  const loadCollections = useCallback(async (silent: boolean = false) => {
    if (!publicKey) return;

    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('creator_address', publicKey)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading collections:', error);
        if (!suppressErrors) {
          toast.error('Failed to load collections');
        }
        return;
      }

      setCollections((data || []) as Collection[]);
    } catch (error) {
      console.error('Unexpected error loading collections:', error);
      if (!suppressErrors) {
        toast.error('Failed to load collections');
      }
    } finally {
      if (!silent) setLoading(false);
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

      // Handle supply mode logic
      const supplyMode = collectionData.supply_mode || 'fixed';
      const maxSupply = supplyMode === 'open' ? 0 : (collectionData.max_supply || 1000);

      // Call secure edge function to create collection
      const { data, error } = await supabase.functions.invoke('create-collection', {
        body: {
          id: collectionId,
          name: collectionData.name,
          symbol: collectionData.symbol,
          site_description: collectionData.site_description || null,
          onchain_description: collectionData.onchain_description || null,
          image_url: imageUrl,
          banner_image_url: bannerUrl,
          creator_address: publicKey,
          external_links: collectionData.external_links || [],
          category: collectionData.category || null,
          explicit_content: collectionData.explicit_content || false,
          supply_mode: supplyMode,
          enable_primary_sales: collectionData.enable_primary_sales ?? false,
          mint_price: collectionData.mint_price ?? 0,
          max_supply: maxSupply,
          royalty_percentage: collectionData.royalty_percentage ?? 0,
          treasury_wallet: collectionData.treasury_wallet || publicKey,
          whitelist_enabled: collectionData.whitelist_enabled ?? false,
          is_live: false,
          go_live_date: collectionData.go_live_date || null,
          mint_end_at: collectionData.mint_end_at || null,
          locked_fields: collectionData.locked_fields || [],
          attributes: collectionData.attributes || [],
        }
      });

      if (error || !data?.success) {
        console.error('Error creating collection:', error || data);
        const errorMessage = data?.error || error?.message || 'Failed to create collection';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      await loadCollections();

      toast.success(`Collection "${collectionData.name}" created successfully!`);
      return { success: true, collection: data.collection };

    } catch (error) {
      console.error('Unexpected error creating collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create collection';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
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

  // Update collection with field locking and supply mode
  const updateCollection = async (collectionId: string, updates: Partial<CreateCollectionData & { locked_fields: string[] }>) => {
    try {
      // Use edge function for secure updates
      const { data, error } = await supabase.functions.invoke('update-collection', {
        body: {
          collection_id: collectionId,
          updates: {
            ...updates,
            // Handle supply mode changes
            max_supply: updates.supply_mode === 'open' ? 0 : updates.max_supply,
          }
        }
      });

      if (error || !data?.success) {
        console.error('Error updating collection:', error || data);
        const errorMessage = data?.error || error?.message || 'Failed to update collection';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      await loadCollections();
      toast.success('Collection updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update collection';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Load collections on wallet connection
  useEffect(() => {
    if (publicKey && autoLoad) {
      loadCollections();
    } else {
      setCollections([]);
    }
  }, [publicKey, loadCollections, autoLoad]);

  return {
    collections,
    loading,
    creating,
    createCollection,
    updateCollectionStatus,
    updateCollection,
    refreshCollections: (options?: { silent?: boolean }) => loadCollections(options?.silent)
  };
};
