import { hasRequiredListingFields, isCollectionMarketEligible, getMissingListingFields, getMissingCollectionFields } from './listingRules';

export { 
  hasRequiredListingFields, 
  isCollectionMarketEligible, 
  getMissingListingFields,
  getMissingCollectionFields 
} from './listingRules';

export const formatAttributeValue = (value: any): string => {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  } else if (Array.isArray(value)) {
    return value.join(', ');
  } else if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  } else {
    return String(value);
  }
};

export const formatAttributes = (attributes: any): { key: string; value: string }[] => {
  if (!attributes || typeof attributes !== 'object') {
    return [];
  }

  return Object.entries(attributes).map(([key, value]) => ({
    key: key.replace(/_/g, ' '),
    value: formatAttributeValue(value),
  }));
};

export const parseAttributes = (attributesString: string): any => {
  try {
    return JSON.parse(attributesString);
  } catch (error) {
    console.error('Error parsing attributes:', error);
    return {};
  }
};
