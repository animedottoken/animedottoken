// Robust helpers for extracting NFT attribute values regardless of format

/**
 * Get attribute value from NFT attributes, handling various formats and key variations
 */
export const getAttributeValue = (attributes: any, targetKey: string): any => {
  if (!attributes) return undefined;

  // Normalize the target key for comparison (lowercase, no spaces/underscores)
  const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\s-]/g, '');
  const normalizedTarget = normalizeKey(targetKey);

  // Handle array format: [{ trait_type: "Background", value: "Blue" }]
  if (Array.isArray(attributes)) {
    const match = attributes.find(attr => 
      attr && attr.trait_type && normalizeKey(attr.trait_type) === normalizedTarget
    );
    return match?.value;
  }

  // Handle object format: { background: "Blue", category: "Art" }
  if (typeof attributes === 'object' && attributes !== null) {
    // Try direct key match first
    const directMatch = Object.keys(attributes).find(key => 
      normalizeKey(key) === normalizedTarget
    );
    if (directMatch !== undefined) {
      return attributes[directMatch];
    }
  }

  return undefined;
};

/**
 * Check if NFT has all required listing fields populated
 */
export const hasRequiredListingFields = (nft: any): boolean => {
  if (!nft.is_listed) return true; // Not listed, no requirements

  // Only require basic NFT fields and explicit content - category/royalty have defaults
  if (!nft.name?.trim() || (nft.price ?? 0) <= 0) return false;

  // Check explicit content is defined (category and royalty default to "Other" and 0)
  const explicitRaw = getAttributeValue(nft.attributes, 'explicit_content');
  if (explicitRaw === undefined || explicitRaw === null) return false;

  return true;
};

/**
 * Get category from NFT attributes
 */
export const getNFTCategory = (attributes: any): string => {
  const category = getAttributeValue(attributes, 'category');
  return category ? String(category).trim() : 'Other';
};

/**
 * Get royalty percentage from NFT attributes
 */
export const getNFTRoyalty = (attributes: any): number | undefined => {
  const royaltyRaw = getAttributeValue(attributes, 'royalty_percentage');
  if (royaltyRaw === undefined || royaltyRaw === null) return undefined;
  const royalty = parseFloat(String(royaltyRaw));
  return Number.isNaN(royalty) ? undefined : royalty;
};

/**
 * Get explicit content flag from NFT attributes
 */
export const getNFTExplicitContent = (attributes: any): boolean => {
  const explicitRaw = getAttributeValue(attributes, 'explicit_content');
  if (explicitRaw === undefined || explicitRaw === null) return false;
  return explicitRaw === true || 
         String(explicitRaw).toLowerCase() === 'true' || 
         String(explicitRaw).toLowerCase() === 'yes' || 
         String(explicitRaw) === '1';
};