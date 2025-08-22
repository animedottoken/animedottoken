import type { Database } from '@/integrations/supabase/types';

// Use the Supabase-generated type as the base
export type Collection = Database['public']['Tables']['collections']['Row'];

// Create collection data interface for creation/updates
export interface CreateCollectionData {
  name: string;
  symbol?: string;
  site_description?: string;
  onchain_description?: string;
  image_file?: File;
  banner_file?: File;
  external_links?: { type: string; url: string }[];
  category?: string;
  explicit_content?: boolean;
  supply_mode?: string;
  enable_primary_sales?: boolean;
  mint_price?: number;
  max_supply?: number;
  royalty_percentage?: number;
  treasury_wallet?: string;
  whitelist_enabled?: boolean;
  go_live_date?: string;
  mint_end_at?: string;
  locked_fields?: string[];
}

// Helper function to get the best available description
export const getCollectionDescription = (collection: Collection): string => {
  return collection.site_description || collection.description || collection.onchain_description || 'No description';
};

// Helper function to get a short description
export const getCollectionShortDescription = (collection: Collection, maxLength: number = 100): string => {
  const description = getCollectionDescription(collection);
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength).trim() + '...';
};