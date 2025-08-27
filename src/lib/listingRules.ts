
export interface NFTListingRequirements {
  price: boolean;
  category: boolean;
  description: boolean;
  image_url: boolean;
}

export interface CollectionListingRequirements {
  mint_price: boolean;
  category: boolean;
  description: boolean;
  image_url: boolean;
  royalty_percentage: boolean;
  is_live: boolean;
  is_active: boolean;
}

export const hasRequiredListingFields = (nft: any): boolean => {
  return !!(
    nft.price && 
    nft.price > 0 &&
    nft.category &&
    nft.description &&
    nft.image_url &&
    nft.is_listed === true
  );
};

export const isCollectionMarketEligible = (collection: any): boolean => {
  return !!(
    collection.mint_price !== undefined &&
    collection.mint_price !== null &&
    collection.category &&
    (collection.description || collection.site_description) &&
    collection.image_url &&
    collection.royalty_percentage !== undefined &&
    collection.royalty_percentage !== null &&
    collection.is_live === true &&
    collection.is_active === true
  );
};

export const getMissingListingFields = (nft: any): string[] => {
  const missing: string[] = [];
  
  if (!nft.price || nft.price <= 0) missing.push('Price');
  if (!nft.category) missing.push('Category');
  if (!nft.description) missing.push('Description');
  if (!nft.image_url) missing.push('Image');
  
  return missing;
};

export const getMissingCollectionFields = (collection: any): string[] => {
  const missing: string[] = [];
  
  if (collection.mint_price === undefined || collection.mint_price === null) missing.push('Mint Price');
  if (!collection.category) missing.push('Category');
  if (!collection.description && !collection.site_description) missing.push('Description');
  if (!collection.image_url) missing.push('Image');
  if (collection.royalty_percentage === undefined || collection.royalty_percentage === null) missing.push('Royalty Percentage');
  
  return missing;
};
