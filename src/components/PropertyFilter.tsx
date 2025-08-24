import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Filter, X, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PropertyValue {
  value: string;
  count: number;
}

interface PropertyGroup {
  trait_type: string;
  values: PropertyValue[];
}

interface PropertyFilterProps {
  nfts: any[];
  onFiltersChange: (filters: Record<string, string[]>) => void;
  selectedFilters: Record<string, string[]>;
}

export function PropertyFilter({ nfts, onFiltersChange, selectedFilters }: PropertyFilterProps) {
  const [propertyGroups, setPropertyGroups] = useState<PropertyGroup[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Extract and count all properties from NFTs
    const propertyMap = new Map<string, Map<string, number>>();
    
    nfts.forEach(nft => {
      if (!nft.attributes) return;
      
      let properties: { trait_type: string; value: string }[] = [];
      
      if (Array.isArray(nft.attributes)) {
        properties = nft.attributes.filter(attr => attr?.trait_type && attr?.value);
      } else if (typeof nft.attributes === 'object') {
        properties = Object.entries(nft.attributes)
          .filter(([key, value]) => 
            !['explicit_content', 'minted_at', 'standalone'].includes(key) && 
            value !== null && value !== undefined
          )
          .map(([key, value]) => ({
            trait_type: key.replace(/_/g, ' '),
            value: String(value)
          }));
      }
      
      properties.forEach(({ trait_type, value }) => {
        if (!propertyMap.has(trait_type)) {
          propertyMap.set(trait_type, new Map());
        }
        const valueMap = propertyMap.get(trait_type)!;
        valueMap.set(value, (valueMap.get(value) || 0) + 1);
      });
    });
    
    // Convert to PropertyGroup format and sort
    const groups: PropertyGroup[] = Array.from(propertyMap.entries())
      .map(([trait_type, valueMap]) => ({
        trait_type,
        values: Array.from(valueMap.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count) // Sort by count descending
      }))
      .sort((a, b) => a.trait_type.localeCompare(b.trait_type)); // Sort trait types alphabetically
    
    setPropertyGroups(groups);
    
    // Auto-open the first few groups
    const initialOpenState: Record<string, boolean> = {};
    groups.slice(0, 3).forEach(group => {
      initialOpenState[group.trait_type] = true;
    });
    setOpenGroups(initialOpenState);
  }, [nfts]);

  const togglePropertyValue = (traitType: string, value: string) => {
    const currentValues = selectedFilters[traitType] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    const newFilters = { ...selectedFilters };
    if (newValues.length === 0) {
      delete newFilters[traitType];
    } else {
      newFilters[traitType] = newValues;
    }
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const toggleGroup = (traitType: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [traitType]: !prev[traitType]
    }));
  };

  const selectedCount = Object.values(selectedFilters).reduce(
    (total, values) => total + values.length, 
    0
  );

  if (propertyGroups.length === 0) {
    return null;
  }

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Properties
          </div>
          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs"
            >
              Clear ({selectedCount})
              <X className="h-3 w-3 ml-1" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[500px] pr-3">
          <div className="space-y-3">
            {propertyGroups.map((group, index) => (
              <div key={group.trait_type}>
                <Collapsible
                  open={openGroups[group.trait_type]}
                  onOpenChange={() => toggleGroup(group.trait_type)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto"
                    >
                      <span className="font-medium text-sm capitalize">
                        {group.trait_type}
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedFilters[group.trait_type]?.length && (
                          <Badge variant="secondary" className="h-5 text-xs">
                            {selectedFilters[group.trait_type].length}
                          </Badge>
                        )}
                        <ChevronDown className={`h-3 w-3 transition-transform ${
                          openGroups[group.trait_type] ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="space-y-1 pl-2">
                      {group.values.slice(0, 20).map((propertyValue) => {
                        const isSelected = selectedFilters[group.trait_type]?.includes(propertyValue.value) || false;
                        return (
                          <Button
                            key={propertyValue.value}
                            variant={isSelected ? "secondary" : "ghost"}
                            className="w-full justify-between h-auto p-2 text-xs"
                            onClick={() => togglePropertyValue(group.trait_type, propertyValue.value)}
                          >
                            <span className="truncate flex-1 text-left">
                              {propertyValue.value}
                            </span>
                            <Badge variant="outline" className="h-4 text-[10px] ml-1">
                              {propertyValue.count}
                            </Badge>
                          </Button>
                        );
                      })}
                      {group.values.length > 20 && (
                        <p className="text-xs text-muted-foreground px-2 py-1">
                          +{group.values.length - 20} more values
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                {index < propertyGroups.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}