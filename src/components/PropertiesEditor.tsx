import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Hash, Type, Palette } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  { value: '', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boost_percentage', label: 'Boost Percentage' },
  { value: 'boost_number', label: 'Boost Number' },
  { value: 'date', label: 'Date' }
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

  const addProperty = () => {
    if (newProperty.trait_type.trim() && newProperty.value.trim()) {
      onChange([...properties, { ...newProperty }]);
      setNewProperty({ trait_type: '', value: '', display_type: '' });
    }
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

  const getDisplayIcon = (displayType?: string) => {
    switch (displayType) {
      case 'number':
      case 'boost_number':
      case 'boost_percentage':
        return <Hash className="h-4 w-4" />;
      case 'date':
        return <Palette className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Properties
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
                      placeholder="Trait (e.g., Color)"
                      value={property.trait_type}
                      onChange={(e) => updateProperty(index, 'trait_type', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Value (e.g., Blue)"
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
                          {type.label}
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
                placeholder="e.g., Background, Eyes, Hat"
                value={newProperty.trait_type}
                onChange={(e) => setNewProperty({ ...newProperty, trait_type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trait_value" className="text-xs">Value</Label>
              <Input
                id="trait_value"
                placeholder="e.g., Blue, Rare, Golden"
                value={newProperty.value}
                onChange={(e) => setNewProperty({ ...newProperty, value: e.target.value })}
              />
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
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
  );
};
