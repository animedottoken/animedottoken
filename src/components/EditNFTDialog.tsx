import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit, Calendar, ExternalLink, Coins } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PropertiesEditor, type Property } from "@/components/PropertiesEditor";
import type { UserNFT } from "@/hooks/useUserNFTs";

interface EditNFTDialogProps {
  nft: UserNFT;
  onUpdate?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Helper functions to convert between NFT attributes and PropertiesEditor format
const attributesToProperties = (attributes: any): Property[] => {
  if (!attributes) return [];
  
  // If attributes has __list, use it for rich editing
  if (attributes.__list && Array.isArray(attributes.__list)) {
    return attributes.__list;
  }
  
  // Handle array format
  if (Array.isArray(attributes)) {
    return attributes.map(attr => ({
      trait_type: attr.trait_type || '',
      value: attr.value || '',
      display_type: attr.display_type || undefined
    }));
  }
  
  // Handle object format - convert to array
  if (typeof attributes === 'object') {
    return Object.entries(attributes).map(([key, value]) => ({
      trait_type: key,
      value: String(value || ''),
      display_type: undefined
    }));
  }
  
  return [];
};

const propertiesToAttributes = (properties: Property[], originalAttributes: any) => {
  if (properties.length === 0) return null;
  
  // Keep both formats for compatibility
  const result: any = {
    __list: properties // Rich format for round-trip editing
  };
  
  // Also maintain object format for compatibility
  properties.forEach(prop => {
    if (prop.trait_type && prop.value) {
      result[prop.trait_type] = prop.value;
    }
  });
  
  return result;
};

export function EditNFTDialog({ nft, onUpdate, open: externalOpen, onOpenChange: externalOnOpenChange }: EditNFTDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const dialogOpen = externalOpen !== undefined ? externalOpen : isOpen;
  const setDialogOpen = externalOnOpenChange || setIsOpen;
  const [formData, setFormData] = useState({
    name: nft.name,
    description: nft.description || '',
    symbol: nft.symbol || '',
    price: nft.price?.toString() || '',
    category: nft.metadata?.category || '',
    royalty_percentage: nft.metadata?.royalty_percentage?.toString() || '0',
    explicit_content: nft.metadata?.explicit_content || false,
  });
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (dialogOpen) {
      setFormData({
        name: nft.name,
        description: nft.description || '',
        symbol: nft.symbol || '',
        price: nft.price?.toString() || '',
        category: nft.metadata?.category || '',
        royalty_percentage: nft.metadata?.royalty_percentage?.toString() || '0',
        explicit_content: nft.metadata?.explicit_content || false,
      });
      setProperties(attributesToProperties(nft.metadata));
    }
  }, [dialogOpen, nft]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const price = formData.price ? parseFloat(formData.price) : null;
    const isListing = price !== null && price > 0;

    // Validate mandatory fields for listing
    if (isListing) {
      const missingFields = [];
      if (!formData.category?.trim()) missingFields.push('Category');
      if (!formData.royalty_percentage || parseFloat(formData.royalty_percentage) < 0) missingFields.push('Royalties');
      
      if (missingFields.length > 0) {
        toast.error(`To list your NFT, please fill in: ${missingFields.join(', ')}`);
        return;
      }
    }

    setLoading(true);

    try {
      // Prepare updated attributes with mandatory listing fields
      const updatedAttributes = propertiesToAttributes(properties, nft.metadata) || {};
      
      // Store mandatory listing fields in attributes for consistency
      if (formData.category?.trim()) {
        updatedAttributes.category = formData.category.trim();
      }
      if (formData.royalty_percentage) {
        updatedAttributes.royalty_percentage = parseFloat(formData.royalty_percentage);
      }
      updatedAttributes.explicit_content = formData.explicit_content;
      
      // Update NFT in database
      const { error } = await supabase
        .from('nfts')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          symbol: formData.symbol.trim() || null,
          price: price,
          is_listed: isListing,
          attributes: updatedAttributes,
          updated_at: new Date().toISOString()
        })
        .eq('id', nft.id);

      if (error) throw error;

      toast.success('NFT updated successfully!');
      setDialogOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating NFT:', error);
      toast.error('Failed to update NFT');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {/* Only show trigger if no external control */}
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit NFT Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Storage Info Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="onchain" className="text-xs">On-Chain</Badge>
                <span className="text-blue-700 dark:text-blue-300">Permanent blockchain data (name, properties)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="offchain" className="text-xs">Off-Chain</Badge>
                <span className="text-emerald-700 dark:text-emerald-300">App database data (price, listing)</span>
              </div>
            </div>
          </div>

          {/* NFT Image Preview */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden">
              <img
                src={nft.image_url || "/placeholder.svg"}
                alt={nft.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.src !== "/placeholder.svg") {
                    img.src = "/placeholder.svg";
                  }
                }}
              />
            </div>
          </div>

          {/* Read-only Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NFT Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Technical information about this NFT (read-only)
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Mint Address</Label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {nft.mint_address ? `${nft.mint_address.slice(0, 8)}...${nft.mint_address.slice(-8)}` : 'Not available'}
                    </code>
                    {nft.mint_address && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(`https://solscan.io/token/${nft.mint_address}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Creator Address</Label>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono block">
                    {nft.creator_address ? `${nft.creator_address.slice(0, 8)}...${nft.creator_address.slice(-8)}` : 'Not available'}
                  </code>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Collection</Label>
                  <p className="text-sm">{nft.collection_name || 'Standalone NFT'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Created</Label>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="text-sm">{formatDate(nft.created_at)}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Currency</Label>
                  <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    <span className="text-sm">SOL</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Listed</Label>
                  <Badge variant={nft.is_listed ? "default" : "secondary"}>
                    {nft.is_listed ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Basic Information
                {nft.mint_address ? (
                  <Badge variant="secondary" className="text-xs">Read-Only (Minted)</Badge>
                ) : (
                  <Badge variant="onchain" className="text-xs">On-Chain Data</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {nft.mint_address 
                  ? "This NFT has been minted - on-chain data cannot be modified." 
                  : "These changes will be stored permanently on the blockchain and visible in all wallets and marketplaces."
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="name">Name *</Label>
                    {nft.mint_address ? (
                      <Badge variant="secondary" className="text-xs">Immutable</Badge>
                    ) : (
                      <Badge variant="onchain" className="text-xs">On-Chain</Badge>
                    )}
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter NFT name"
                    disabled={!!nft.mint_address}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {nft.mint_address 
                      ? "Cannot be changed after minting - permanently stored on blockchain"
                      : "Permanently stored on blockchain, visible in all wallets"
                    }
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="symbol">Symbol</Label>
                    {nft.mint_address ? (
                      <Badge variant="secondary" className="text-xs">Immutable</Badge>
                    ) : (
                      <Badge variant="onchain" className="text-xs">On-Chain</Badge>
                    )}
                  </div>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="Enter NFT symbol (optional)"
                    disabled={!!nft.mint_address}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="description">Description</Label>
                    {nft.mint_address ? (
                      <Badge variant="secondary" className="text-xs">Immutable</Badge>
                    ) : (
                      <Badge variant="onchain" className="text-xs">On-Chain</Badge>
                    )}
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter NFT description (optional)"
                    rows={3}
                    disabled={!!nft.mint_address}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {nft.mint_address 
                      ? "Cannot be changed after minting - permanently stored on blockchain"
                      : "Stored on blockchain metadata"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Listing & Price
                <Badge variant="offchain" className="text-xs">Off-Chain Data</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Listing information is stored in our app database and can be changed anytime.
              </p>
            </CardHeader>
            <CardContent>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="price">Price (SOL)</Label>
                  <Badge variant="offchain" className="text-xs">Off-Chain</Badge>
                </div>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Setting a price will automatically list your NFT for sale. Leave empty to unlist.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Marketplace Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Marketplace Requirements
                <Badge variant="required" className="text-xs">Required for Marketplace</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These fields have sensible defaults but can be customized if needed.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <details className="space-y-4">
                <summary className="cursor-pointer text-base font-medium text-muted-foreground hover:text-foreground transition-colors">
                  ⚙️ Advanced Settings (Category & Royalties)
                </summary>
                
                <div className="grid gap-4 pl-4 pt-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="category">Category</Label>
                      <Badge variant="required" className="text-xs">Required for Marketplace</Badge>
                    </div>
                    <Select
                      value={formData.category || ''}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Other (default)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Art">Art</SelectItem>
                        <SelectItem value="Gaming">Gaming</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Photography">Photography</SelectItem>
                        <SelectItem value="Collectibles">Collectibles</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.category ? `Selected: ${formData.category}` : "Will default to 'Other' if not set"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="royalty">Creator Royalties (%)</Label>
                      <Badge variant="required" className="text-xs">Required for Marketplace</Badge>
                    </div>
                    <Input
                      id="royalty"
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={formData.royalty_percentage}
                      onChange={(e) => setFormData({ ...formData, royalty_percentage: e.target.value })}
                      placeholder="0 (default)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.royalty_percentage ? `${formData.royalty_percentage}% earnings on secondary sales` : "Will default to 0% if not set"}
                    </p>
                  </div>
                </div>
              </details>

              {/* Explicit Content - Always Visible */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="explicit-content" className="text-base font-medium">
                        Content Declaration
                      </Label>
                      <Badge variant="required" className="text-xs">Required for Marketplace</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Declare if your NFT contains explicit or sensitive content
                    </p>
                  </div>
                  <Switch
                    id="explicit-content"
                    checked={formData.explicit_content || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, explicit_content: checked })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.explicit_content ? "⚠️ Marked as explicit/sensitive content" : "✅ Safe for all audiences (default)"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Properties & Traits
                <Badge variant="onchain" className="text-xs">On-Chain Data</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Properties are stored permanently on the blockchain and affect rarity and marketplace filters.
              </p>
            </CardHeader>
            <CardContent>
              <PropertiesEditor
                properties={properties}
                onChange={setProperties}
              />
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fields marked with * are required</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="onchain" className="text-xs">On-Chain</Badge>
                    <span className="text-blue-700 dark:text-blue-300">Permanent</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">💡 On-chain changes are permanent and visible everywhere</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="offchain" className="text-xs">Off-Chain</Badge>
                    <span className="text-emerald-700 dark:text-emerald-300">Flexible</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
