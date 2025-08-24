// Utility functions for handling NFT attributes and properties

export const formatPropertyValue = (value: any): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
};

// System fields to exclude from properties display
export const systemFields = new Set([
  'quantity_index', 
  'total_quantity', 
  'minted_at', 
  'explicit_content', 
  'standalone', 
  'edition', 
  'max_supply',
  '__list',
  'metadata_uri',
  'mint_address',
  'created_at',
  'updated_at'
]);

export const normalizeTraitType = (traitType: string): string => {
  return traitType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export const normalizeAttributes = (metadata: any) => {
  const properties: { trait_type: string; value: string; display_type?: string }[] = [];
  
  if (Array.isArray(metadata)) {
    // Standard trait format: [{ trait_type: "Background", value: "Blue" }]
    return metadata
      .filter(attr => attr && attr.trait_type && attr.value !== null && attr.value !== undefined)
      .filter(attr => !systemFields.has(attr.trait_type?.toLowerCase()))
      .map(attr => ({
        ...attr,
        trait_type: normalizeTraitType(attr.trait_type),
        value: formatPropertyValue(attr.value)
      }));
  } else if (typeof metadata === 'object' && metadata !== null) {
    // Object format: convert to trait format
    Object.entries(metadata).forEach(([key, value]) => {
      // Skip internal metadata fields
      if (systemFields.has(key.toLowerCase()) || value === null || value === undefined) {
        return;
      }
      
      properties.push({
        trait_type: normalizeTraitType(key),
        value: formatPropertyValue(value)
      });
    });
  }
  
  return properties;
};