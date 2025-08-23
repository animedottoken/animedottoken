import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Hash, Type, Palette, Calendar, AlertCircle, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface Property {
  trait_type: string;
  value: string;
  display_type?: string;
}

interface PropertiesEditorProps {
  properties: Property[];
  onChange: (properties: Property[]) => void;
  className?: string;
}

const DISPLAY_TYPES = [
  { value: 'text', label: 'Text', description: 'Any text value (names, colors, etc.)' },
  { value: 'number', label: 'Number', description: 'Plain numeric value (power, level, etc.)' },
  { value: 'boost_percentage', label: 'Bonus (%)', description: 'Percentage bonus (0-100%)' },
  { value: 'boost_number', label: 'Bonus (number)', description: 'Numeric bonus (+attack, +defense)' },
  { value: 'date', label: 'Date', description: 'Date value (YYYY-MM-DD format)' }
];

export const PropertiesEditor: React.FC<PropertiesEditorProps> = ({
  properties,
  onChange,
  className = ''
}) => {
  const [newProperty, setNewProperty] = useState<Property>({
    trait_type: '',
    value: '',
    display_type: ''
  });
  const [validationError, setValidationError] = useState<string>('');

  const validateValue = (value: string, displayType: string): string => {
    if (!value.trim()) return '';
    
    switch (displayType) {
      case 'number':
      case 'boost_number':
        if (!/^-?\d+(\.\d+)?$/.test(value)) {
          return 'Must be a valid number';
        }
        break;
      case 'boost_percentage':
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 100) {
          return 'Must be a number between 0 and 100';
        }
        break;
      case 'date':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return 'Must be in YYYY-MM-DD format';
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Must be a valid date';
        }
        break;
    }
    return '';
  };

  const addProperty = () => {
    if (!newProperty.trait_type.trim() || !newProperty.value.trim()) {
      return;
    }
    
    const error = validateValue(newProperty.value, newProperty.display_type || 'text');
    if (error) {
      setValidationError(error);
      return;
    }
    
    onChange([...properties, { ...newProperty }]);
    setNewProperty({ trait_type: '', value: '', display_type: '' });
    setValidationError('');
  };

  const removeProperty = (index: number) => {
    onChange(properties.filter((_, i) => i !== index));
  };

  const updateProperty = (index: number, field: keyof Property, value: string) => {
    const updated = properties.map((prop, i) => 
      i === index ? { ...prop, [field]: value } : prop
    );
    onChange(updated);
  };

  const getPlaceholder = (displayType: string, isValue: boolean): string => {
    if (!isValue) return 'e.g., Background, Eyes, Hat';
    
    switch (displayType) {
      case 'number':
        return 'e.g., 42, 100, 7';
      case 'boost_number':
        return 'e.g., +10, +5, +25';
      case 'boost_percentage':
        return 'e.g., 15, 50, 75';
      case 'date':
        return 'e.g., 2025-12-31';
      default:
        return 'e.g., Blue, Rare, Golden';
    }
  };

  const getDisplayIcon = (displayType?: string) => {
    switch (displayType) {
      case 'number':
      case 'boost_number':
      case 'boost_percentage':
        return <Hash className="h-4 w-4" />;
      case 'date':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Properties
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Properties help describe unique traits and enable filtering in marketplaces</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add traits and attributes that make your NFT unique
          </p>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Properties */}
        {properties.length > 0 && (
          <div className="space-y-3">
            {properties.map((property, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  {getDisplayIcon(property.display_type)}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder={getPlaceholder(property.display_type || 'text', false)}
                      value={property.trait_type}
                      onChange={(e) => updateProperty(index, 'trait_type', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder={getPlaceholder(property.display_type || 'text', true)}
                      value={property.value}
                      onChange={(e) => updateProperty(index, 'value', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Select
                    value={property.display_type || ''}
                    onValueChange={(value) => updateProperty(index, 'display_type', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPLAY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div>{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProperty(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Property */}
        <div className="space-y-3 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <Label className="text-sm font-medium">Add New Property</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="trait_type" className="text-xs">Trait Type</Label>
              <Input
                id="trait_type"
                placeholder={getPlaceholder(newProperty.display_type || 'text', false)}
                value={newProperty.trait_type}
                onChange={(e) => setNewProperty({ ...newProperty, trait_type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trait_value" className="text-xs">Value</Label>
              <Input
                id="trait_value"
                placeholder={getPlaceholder(newProperty.display_type || 'text', true)}
                value={newProperty.value}
                onChange={(e) => {
                  setNewProperty({ ...newProperty, value: e.target.value });
                  setValidationError('');
                }}
                className={validationError ? 'border-destructive' : ''}
              />
              {validationError && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {validationError}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Display Type</Label>
            <Select
              value={newProperty.display_type || ''}
              onValueChange={(value) => setNewProperty({ ...newProperty, display_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select display type" />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div>{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Bonus types</strong> are for "extra" values that could be filtered separately in marketplaces (like +10 attack or 15% luck boost)
                </AlertDescription>
              </Alert>
            </div>
          </div>
          <Button
            onClick={addProperty}
            disabled={!newProperty.trait_type.trim() || !newProperty.value.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {properties.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No properties added yet</p>
            <p className="text-xs">Properties help describe unique traits of your NFT</p>
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};
