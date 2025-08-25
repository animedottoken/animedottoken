
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Unlock, Info, Infinity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PropertiesEditor } from '@/components/PropertiesEditor';
import { Collection } from '@/hooks/useCollections';

interface FieldRule {
  label: string;
  type: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  canEdit: () => boolean;
  badge: string;
  help?: string;
  hidden?: () => boolean;
  visible?: () => boolean;
  required?: boolean;
  transform?: (value: string) => string;
  options?: string[] | { value: string; label: string }[];
}

interface FlexibleFieldEditorProps {
  collection: Collection;
  onUpdate: (updates: any) => Promise<void>;
  isOwner: boolean;
}

export const FlexibleFieldEditor = ({ collection, onUpdate, isOwner }: FlexibleFieldEditorProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [localLockedFields, setLocalLockedFields] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Safely handle locked_fields as it might be Json type from Supabase
  const lockedFields = localLockedFields.length > 0 ? localLockedFields : (Array.isArray(collection.locked_fields) ? collection.locked_fields as string[] : []);
  const itemsRedeemed = collection.items_redeemed || 0;
  const hasMintedNFTs = itemsRedeemed > 0;
  const isCollectionMinted = Boolean(collection.collection_mint_address);

  // Define field rules
  const fieldRules: Record<string, FieldRule> = {
    // Basic Information
    name: { 
      label: 'Collection Name', 
      type: 'text', 
      maxLength: 100, 
      canEdit: () => !isCollectionMinted && !lockedFields.includes('name'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      required: true,
      help: 'Name of your collection (visible on marketplaces)'
    },
    symbol: { 
      label: 'Symbol', 
      type: 'text', 
      maxLength: 10, 
      canEdit: () => !isCollectionMinted && !lockedFields.includes('symbol'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      transform: (value: string) => value.toUpperCase(),
      help: 'Short symbol for your collection (e.g., AWESOME)'
    },
    site_description: { 
      label: 'Public Description', 
      type: 'textarea', 
      maxLength: 2000, 
      canEdit: () => !lockedFields.includes('site_description'),
      badge: 'Off-Chain',
      help: 'This appears on your public collection page in this app. Good for long details, roadmap, utilities, links.'
    },
    onchain_description: { 
      label: 'Short Description', 
      type: 'textarea', 
      maxLength: 200, 
      canEdit: () => !isCollectionMinted && !lockedFields.includes('onchain_description'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      help: 'Stored on-chain and shown in wallets/marketplaces. Keep it brief.'
    },
    
    // Pricing & Sales
    enable_primary_sales: { 
      label: 'Enable Primary Sales', 
      type: 'switch', 
      canEdit: () => !isCollectionMinted && !lockedFields.includes('enable_primary_sales'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      help: 'Allow primary market sales with mint price'
    },
    mint_price: { 
      label: 'Price (SOL)', 
      type: 'number', 
      canEdit: () => !isCollectionMinted && !lockedFields.includes('mint_price'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      min: 0,
      step: 0.001,
      help: collection.enable_primary_sales 
        ? 'Price for minting new NFTs from this collection' 
        : 'Price setting (currently disabled - enable Primary Sales to activate)'
    },
    
    // Supply Settings
    supply_mode: { 
      label: 'Supply Mode', 
      type: 'select', 
      options: [
        { value: 'fixed', label: 'Fixed Supply' },
        { value: 'open', label: 'Open Edition' }
      ],
      canEdit: () => !isCollectionMinted && !lockedFields.includes('supply_mode'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      help: 'Whether the collection has a limited or unlimited supply'
    },
    max_supply: { 
      label: 'Max Supply', 
      type: 'number', 
      min: 1, 
      max: 100000, 
      canEdit: () => !isCollectionMinted && !lockedFields.includes('max_supply'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      visible: () => collection.supply_mode === 'fixed',
      help: 'Maximum number of NFTs that can be minted'
    },
    royalty_percentage: { 
      label: 'Royalty %', 
      type: 'number', 
      min: 0, 
      max: 50, 
      step: 0.1, 
      canEdit: () => !isCollectionMinted && !lockedFields.includes('royalty_percentage'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      help: 'Percentage of secondary sales paid as royalties'
    },
    
    // Wallet & Settings
    treasury_wallet: { 
      label: 'Treasury Wallet', 
      type: 'text', 
      canEdit: () => !isCollectionMinted && !lockedFields.includes('treasury_wallet'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      help: 'Wallet address that receives mint payments and royalties'
    },
    whitelist_enabled: { 
      label: 'Whitelist Enabled', 
      type: 'switch', 
      canEdit: () => !lockedFields.includes('whitelist_enabled'),
      badge: 'Off-Chain',
      help: 'Require wallet addresses to be pre-approved for minting'
    },
    
    // Metadata & Configuration
    mint_end_at: { 
      label: 'Mint End Date', 
      type: 'datetime-local', 
      canEdit: () => !lockedFields.includes('mint_end_at'),
      badge: 'Off-Chain',
      help: 'Optional date when minting automatically ends'
    },
    category: { 
      label: 'Category', 
      type: 'select', 
      options: [
        { value: 'art', label: 'Art' },
        { value: 'collectibles', label: 'Collectibles' },
        { value: 'gaming', label: 'Gaming' },
        { value: 'music', label: 'Music' },
        { value: 'photography', label: 'Photography' },
        { value: 'sports', label: 'Sports' },
        { value: 'utility', label: 'Utility' },
        { value: 'pfp', label: 'Profile Pictures' },
        { value: 'other', label: 'Other' }
      ],
      canEdit: () => !lockedFields.includes('category'),
      badge: 'Off-Chain',
      help: 'Collection category for better discoverability'
    },
    explicit_content: { 
      label: 'Explicit Content', 
      type: 'switch', 
      canEdit: () => !lockedFields.includes('explicit_content'),
      badge: 'Off-Chain',
      help: 'Mark if collection contains mature/explicit content'
    },
    attributes: { 
      label: 'Properties', 
      type: 'properties', 
      canEdit: () => !isCollectionMinted && !lockedFields.includes('attributes'),
      badge: isCollectionMinted ? 'Chain Locked' : 'Off-Chain',
      help: 'Default properties that will be applied to all NFTs in this collection'
    }
  };

  const isFieldLocked = (fieldName: string) => {
    const rule = fieldRules[fieldName];
    if (!rule) return true;
    
    const creatorLocked = lockedFields.includes(fieldName);
    const chainLocked = !rule.canEdit();
    
    return creatorLocked || chainLocked;
  };

  const getFieldBadge = (fieldName: string) => {
    const rule = fieldRules[fieldName];
    if (!rule) return null;
    
    const creatorLocked = lockedFields.includes(fieldName);
    const chainLocked = !rule.canEdit();
    
    if (creatorLocked) return { text: 'Creator Locked', variant: 'locked' as const, reason: 'Locked by creator settings' };
    if (chainLocked && rule.badge === 'Chain Locked') return { text: 'Chain Locked', variant: 'chainlocked' as const, reason: 'Collection is minted on-chain - cannot edit' };
    if (rule.badge === 'Chain Locked') return { text: 'Chain Locked', variant: 'chainlocked' as const, reason: 'Collection is minted on-chain' };
    if (rule.badge === 'Off-Chain') return { text: 'Off-Chain', variant: 'offchain' as const, reason: 'Stored in app database, can be changed' };
    return { text: rule.badge, variant: 'outline' as const, reason: '' };
  };

  const startEditing = (fieldName: string) => {
    setEditingField(fieldName);
    setFieldValues({ [fieldName]: collection[fieldName as keyof Collection] });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setFieldValues({});
  };

  const saveField = async (fieldName: string) => {
    try {
      // Store current scroll position and field element
      const scrollPosition = window.scrollY;
      const fieldElement = document.getElementById(`field-${fieldName}`);
      
      await onUpdate({ [fieldName]: fieldValues[fieldName] });
      setEditingField(null);
      setFieldValues({});
      
      // Restore scroll position after a brief delay
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
        if (fieldElement) {
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to save field:', error);
    }
  };

  const toggleFieldLock = async (fieldName: string) => {
    if (!isOwner || isUpdating) return;
    
    const currentLocked = lockedFields.includes(fieldName);
    const newLockedFields = currentLocked 
      ? lockedFields.filter(f => f !== fieldName)
      : [...lockedFields, fieldName];
    
    // Store current scroll position and field element
    const scrollPosition = window.scrollY;
    const fieldElement = document.getElementById(`field-${fieldName}`);
    
    // Optimistic update
    setLocalLockedFields(newLockedFields);
    setIsUpdating(true);
    
    try {
      await onUpdate({ locked_fields: newLockedFields });
      
      // Restore scroll position after a brief delay
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
        if (fieldElement) {
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (error) {
      // Revert optimistic update on error
      setLocalLockedFields(Array.isArray(collection.locked_fields) ? collection.locked_fields as string[] : []);
      console.error('Failed to toggle field lock:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderField = (fieldName: string) => {
    const rule = fieldRules[fieldName];
    if (!rule || rule.hidden?.() || (rule.visible && !rule.visible())) return null;

    const value = collection[fieldName as keyof Collection];
    const isLocked = isFieldLocked(fieldName);
    const isEditing = editingField === fieldName;
    const badgeInfo = getFieldBadge(fieldName);
    const creatorCanToggleLock = isOwner && !isCollectionMinted && badgeInfo?.variant !== 'chainlocked';

    if (isEditing) {
      return (
        <div key={fieldName} className="space-y-2 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <Label>{rule.label}</Label>
            {rule.help && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{rule.help}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {rule.type === 'textarea' ? (
            <Textarea
              value={fieldValues[fieldName] || ''}
              onChange={(e) => setFieldValues({ ...fieldValues, [fieldName]: e.target.value })}
              maxLength={rule.maxLength}
            />
          ) : rule.type === 'switch' ? (
            <Switch
              checked={fieldValues[fieldName] || false}
              onCheckedChange={(checked) => setFieldValues({ ...fieldValues, [fieldName]: checked })}
            />
          ) : rule.type === 'select' ? (
            <Select
              value={fieldValues[fieldName] || ''}
              onValueChange={(value) => setFieldValues({ ...fieldValues, [fieldName]: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(rule.options) ? rule.options : []).map((option) => (
                  <SelectItem 
                    key={typeof option === 'string' ? option : option.value} 
                    value={typeof option === 'string' ? option : option.value}
                  >
                    {typeof option === 'string' ? option : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : rule.type === 'datetime-local' ? (
            <div className="space-y-2">
              <Input
                type={rule.type}
                value={fieldValues[fieldName] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  
                  // Validate 4-digit year and future date
                  if (value) {
                    const date = new Date(value);
                    const year = date.getFullYear();
                    const now = new Date();
                    
                    let errorMessage = '';
                    
                    if (year < 1000 || year > 9999) {
                      errorMessage = 'Year must be exactly 4 digits (YYYY)';
                    } else if (date <= now) {
                      errorMessage = 'Date must be in the future';
                    }
                    
                    setFieldValues({ 
                      ...fieldValues, 
                      [fieldName]: value,
                      [`${fieldName}_error`]: errorMessage 
                    });
                  } else {
                    setFieldValues({ ...fieldValues, [fieldName]: value });
                  }
                }}
                min={rule.min}
                max={rule.max}
                step={rule.step}
                maxLength={rule.maxLength}
              />
              {fieldValues[`${fieldName}_error`] && (
                <div className="text-sm text-destructive">
                  {fieldValues[`${fieldName}_error`]}
                </div>
              )}
            </div>
          ) : rule.type === 'properties' ? (
            <div className="space-y-4">
              <PropertiesEditor
                properties={fieldValues[fieldName] || (Array.isArray(collection.attributes) ? collection.attributes : [])}
                onChange={(properties) => setFieldValues({ ...fieldValues, [fieldName]: properties })}
              />
            </div>
          ) : (
            <Input
              type={rule.type}
              value={fieldValues[fieldName] || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                const transformedValue = rule.transform ? rule.transform(inputValue) : inputValue;
                setFieldValues({ ...fieldValues, [fieldName]: transformedValue });
              }}
              min={rule.min}
              max={rule.max}
              step={rule.step}
              maxLength={rule.maxLength}
            />
          )}
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => saveField(fieldName)}
              disabled={!!fieldValues[`${fieldName}_error`]}
            >
              {rule.type === 'properties' ? 'Save Properties' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
          </div>
        </div>
      );
    }

    return (
      <div key={fieldName} id={`field-${fieldName}`} className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Label className="font-medium">{rule.label}</Label>
            {rule.help && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{rule.help}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant={badgeInfo?.variant || 'outline'}
                      className="cursor-help"
                    >
                      {badgeInfo?.text}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{badgeInfo?.reason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Left side padlock - always visible with proper color coding */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {badgeInfo?.variant === 'chainlocked' ? (
                      <Lock className="h-3 w-3 text-red-500" />
                    ) : lockedFields.includes(fieldName) ? (
                      <Lock className="h-3 w-3 text-orange-500" />
                    ) : (
                      <Unlock className="h-3 w-3 text-green-500" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {badgeInfo?.variant === 'chainlocked' 
                        ? 'Chain locked - cannot be edited after minting'
                        : lockedFields.includes(fieldName) 
                        ? 'Creator locked - locked by collection owner'
                        : 'Unlocked - can be edited'
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {fieldName === 'max_supply' && collection.supply_mode === 'open' ? (
              <div className="flex items-center gap-1">
                <Infinity className="h-4 w-4" />
                <span>Unlimited (Open Edition)</span>
              </div>
            ) : fieldName === 'supply_mode' ? (
              collection.supply_mode === 'open' ? 'Open Edition ∞' : 'Fixed Supply'
            ) : rule.type === 'switch' ? (
              value ? 'Enabled' : 'Disabled'
            ) : rule.type === 'datetime-local' ? (
              value ? new Date(value as string).toLocaleString() : 'Not set'
            ) : rule.type === 'properties' ? (
              (() => {
                const props = Array.isArray(value) ? value : [];
                return props.length > 0 ? `${props.length} properties` : 'No properties set';
              })()
            ) : (
              value?.toString() || 'No value set'
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Edit button - only show when field is actually editable */}
          {rule.canEdit() && !lockedFields.includes(fieldName) && isOwner && (
            <Button size="sm" variant="outline" onClick={() => startEditing(fieldName)}>
              Edit
            </Button>
          )}
          
          {/* Right side padlock toggle - only for creator lockable fields */}
          {creatorCanToggleLock && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFieldLock(fieldName)}
                    disabled={isUpdating}
                    className="p-1"
                  >
                    {lockedFields.includes(fieldName) ? (
                      <Lock className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {lockedFields.includes(fieldName) 
                      ? 'Click to unlock this field' 
                      : 'Click to lock this field'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Right side padlock display - for chain locked fields */}
          {badgeInfo?.variant === 'chainlocked' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="h-4 w-4 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chain locked - cannot be edited after minting</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {Object.keys(fieldRules).map(renderField)}
      </div>
      
    </div>
  );
};
