
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

  // Safely handle locked_fields as it might be Json type from Supabase
  const lockedFields = Array.isArray(collection.locked_fields) ? collection.locked_fields as string[] : [];
  const itemsRedeemed = collection.items_redeemed || 0;
  const hasMintedNFTs = itemsRedeemed > 0;

  // Define field rules
  const fieldRules: Record<string, FieldRule> = {
    // Always editable
    name: { 
      label: 'Collection Name', 
      type: 'text', 
      maxLength: 32, 
      canEdit: () => true,
      badge: 'Always Editable'
    },
    site_description: { 
      label: 'Public description (not on-chain)', 
      type: 'textarea', 
      maxLength: 2000, 
      canEdit: () => true,
      badge: 'Always Editable'
    },
    onchain_description: { 
      label: 'Collection Description (metadata)', 
      type: 'textarea', 
      maxLength: 200, 
      canEdit: () => true,
      badge: 'Always Editable',
      help: 'Stored in on-chain metadata for each NFT'
    },
    mint_price: { 
      label: 'Mint Price (SOL)', 
      type: 'number', 
      min: 0, 
      step: 0.01, 
      canEdit: () => true,
      badge: 'Always Editable'
    },
    treasury_wallet: { 
      label: 'Treasury Wallet', 
      type: 'text', 
      canEdit: () => true,
      badge: 'Always Editable'
    },
    whitelist_enabled: { 
      label: 'Whitelist Required', 
      type: 'switch', 
      canEdit: () => true,
      badge: 'Always Editable'
    },
    mint_end_at: { 
      label: 'Mint End Date', 
      type: 'datetime-local', 
      canEdit: () => true,
      badge: 'Always Editable',
      help: 'Date must be in the future with 4-digit year (YYYY-MM-DD)'
    },
    category: { 
      label: 'Category', 
      type: 'select', 
      options: ['Art', 'Gaming', 'Music', 'Sports', 'Utility', 'Profile Pictures', 'Collectibles', 'Other'],
      canEdit: () => true,
      badge: 'Always Editable'
    },
    explicit_content: { 
      label: 'Explicit Content', 
      type: 'switch', 
      canEdit: () => true,
      badge: 'Always Editable'
    },
    
    // Editable until first mint
    supply_mode: { 
      label: 'Supply Mode', 
      type: 'select', 
      options: [
        { value: 'fixed', label: 'Fixed Supply' },
        { value: 'open', label: 'Open Edition ∞' }
      ],
      canEdit: () => !hasMintedNFTs,
      badge: hasMintedNFTs ? 'Locked after first mint' : 'Editable until first mint'
    },
    max_supply: { 
      label: 'Max Supply', 
      type: 'number', 
      min: 1, 
      max: 100000, 
      canEdit: () => !hasMintedNFTs && collection.supply_mode === 'fixed',
      badge: hasMintedNFTs ? 'Locked after first mint' : 'Editable until first mint',
      hidden: () => collection.supply_mode === 'open'
    },
    royalty_percentage: { 
      label: 'Royalties (%)', 
      type: 'number', 
      min: 0, 
      max: 50, 
      step: 0.1, 
      canEdit: () => !hasMintedNFTs,
      badge: hasMintedNFTs ? 'Locked after first mint' : 'Editable until first mint'
    },
    symbol: { 
      label: 'Symbol', 
      type: 'text', 
      maxLength: 10, 
      canEdit: () => !hasMintedNFTs,
      badge: hasMintedNFTs ? 'Locked after first mint' : 'Editable until first mint'
    },
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
    
    if (creatorLocked) return 'Locked by creator';
    if (chainLocked) return rule.badge + ' (Chain rule)';
    return rule.badge;
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
      await onUpdate({ [fieldName]: fieldValues[fieldName] });
      setEditingField(null);
      setFieldValues({});
    } catch (error) {
      console.error('Failed to save field:', error);
    }
  };

  const toggleFieldLock = async (fieldName: string) => {
    if (!isOwner) return;
    
    const currentLocked = lockedFields.includes(fieldName);
    const newLockedFields = currentLocked 
      ? lockedFields.filter(f => f !== fieldName)
      : [...lockedFields, fieldName];
    
    await onUpdate({ locked_fields: newLockedFields });
  };

  const renderField = (fieldName: string) => {
    const rule = fieldRules[fieldName];
    if (!rule || rule.hidden?.()) return null;

    const value = collection[fieldName as keyof Collection];
    const isLocked = isFieldLocked(fieldName);
    const isEditing = editingField === fieldName;
    const badge = getFieldBadge(fieldName);
    const creatorCanToggleLock = isOwner && rule.canEdit() && !hasMintedNFTs;

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
          ) : (
            <Input
              type={rule.type}
              value={fieldValues[fieldName] || ''}
              onChange={(e) => setFieldValues({ ...fieldValues, [fieldName]: e.target.value })}
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
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
          </div>
        </div>
      );
    }

    return (
      <div key={fieldName} className="flex items-center justify-between p-4 border rounded-lg">
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
            {fieldName === 'max_supply' && collection.supply_mode === 'open' ? (
              <div className="flex items-center gap-1">
                <Infinity className="h-4 w-4" />
                <span>Unlimited (Open Edition)</span>
              </div>
            ) : fieldName === 'supply_mode' ? (
              collection.supply_mode === 'open' ? 'Open Edition ∞' : 'Fixed Supply'
            ) : rule.type === 'switch' ? (
              value ? 'Enabled' : 'Disabled'
            ) : (
              value?.toString() || 'Not set'
            )}
          </div>
          
          <Badge variant={isLocked ? 'secondary' : 'outline'} className="text-xs">
            {badge}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {creatorCanToggleLock && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleFieldLock(fieldName)}
              className="h-8 w-8 p-0"
            >
              {lockedFields.includes(fieldName) ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {!isLocked && isOwner && (
            <Button size="sm" onClick={() => startEditing(fieldName)}>
              Edit
            </Button>
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
      
      {isOwner && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Legend</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Always Editable</Badge>
              <span>Can always be changed</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Editable until first mint</Badge>
              <span>Can edit until any NFT is minted</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Locked after first mint</Badge>
              <span>Chain rule - locked automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Locked by creator</Badge>
              <span>You locked this field</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
