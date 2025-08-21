// Collection creation validation utilities

export interface ValidationError {
  field: string;
  message: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Image file validation
export const validateImageFile = (file: File): FileValidationResult => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File must be JPG, PNG, GIF, or WEBP format'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 5MB'
    };
  }

  return { isValid: true };
};

// Collection data validation
export const validateCollectionData = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Only name is required for basic collection creation
  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Collection name is required' });
  } else if (data.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Collection name must be at least 3 characters' });
  } else if (data.name.trim().length > 32) {
    errors.push({ field: 'name', message: 'Collection name must be 32 characters or less' });
  }

  // All other validations are for optional fields - only validate if provided
  if (data.symbol && (data.symbol.length < 2 || data.symbol.length > 10)) {
    errors.push({ field: 'symbol', message: 'Symbol must be 2-10 characters if provided' });
  }

  if (data.site_description && data.site_description.length > 2000) {
    errors.push({ field: 'site_description', message: 'Site description must be 2000 characters or less' });
  }

  if (data.onchain_description && data.onchain_description.length > 200) {
    errors.push({ field: 'onchain_description', message: 'On-chain description must be 200 characters or less' });
  }

  // These validations will only be relevant in the next step when minting
  if (data.enable_primary_sales) {
    if (data.max_supply <= 0 || data.max_supply > 100000) {
      errors.push({ field: 'max_supply', message: 'Max supply must be between 1 and 100,000' });
    }

    if (data.mint_price < 0) {
      errors.push({ field: 'mint_price', message: 'Mint price cannot be negative' });
    }

    if (data.royalty_percentage < 0 || data.royalty_percentage > 50) {
      errors.push({ field: 'royalty_percentage', message: 'Royalty must be between 0% and 50%' });
    }

    if (!data.treasury_wallet?.trim()) {
      errors.push({ field: 'treasury_wallet', message: 'Treasury wallet is required for primary sales' });
    }
  }

  return errors;
};

// Get list of required fields for collection creation
export const getRequiredFields = (enablePrimarySales: boolean = false): string[] => {
  const required = ['name'];
  
  if (enablePrimarySales) {
    required.push('symbol', 'max_supply', 'treasury_wallet');
  }
  
  return required;
};

// Standalone NFT data validation
export const validateStandaloneNFTData = (data: any, imageFile?: File | null): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required fields - artwork is now mandatory
  if (!imageFile) {
    errors.push({ field: 'artwork', message: 'NFT artwork is required' });
  }

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'NFT name is required' });
  } else if (data.name.trim().length < 1) {
    errors.push({ field: 'name', message: 'NFT name cannot be empty' });
  } else if (data.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'NFT name must be 100 characters or less' });
  }

  // Symbol validation (optional but constrained if provided)
  if (data.symbol && (data.symbol.length < 1 || data.symbol.length > 10)) {
    errors.push({ field: 'symbol', message: 'Symbol must be 1-10 characters if provided' });
  }

  // Description validation
  if (data.description && data.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must be 1000 characters or less' });
  }

  // Quantity validation
  if (data.quantity && (data.quantity < 1 || data.quantity > 10)) {
    errors.push({ field: 'quantity', message: 'Quantity must be between 1 and 10' });
  }

  // Royalty validation
  if (data.royalty_percentage && (data.royalty_percentage < 0 || data.royalty_percentage > 50)) {
    errors.push({ field: 'royalty_percentage', message: 'Royalty must be between 0% and 50%' });
  }

  return errors;
};

// Check if all required fields are valid
export const areRequiredFieldsValid = (data: any, enablePrimarySales: boolean = false): boolean => {
  const requiredFields = getRequiredFields(enablePrimarySales);
  
  for (const field of requiredFields) {
    if (field === 'name' && (!data.name?.trim() || data.name.trim().length < 3)) {
      return false;
    }
    if (field === 'symbol' && (!data.symbol?.trim() || data.symbol.trim().length < 2)) {
      return false;
    }
    if (field === 'max_supply' && (!data.max_supply || data.max_supply <= 0)) {
      return false;
    }
    if (field === 'treasury_wallet' && !data.treasury_wallet?.trim()) {
      return false;
    }
  }
  
  return true;
};