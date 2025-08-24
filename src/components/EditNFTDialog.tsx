import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  });
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (dialogOpen) {
      setFormData({
        name: nft.name,
        description: nft.description || '',
        symbol: nft.symbol || '',
        price: nft.price?.toString() || '',
      });
      setProperties(attributesToProperties(nft.metadata));
    }
  }, [dialogOpen, nft]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);

    try {
      const price = formData.price ? parseFloat(formData.price) : null;
      
      // Update NFT in database
      const { error } = await supabase
        .from('nfts')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          symbol: formData.symbol.trim() || null,
          price: price,
          is_listed: price !== null && price > 0,
          attributes: propertiesToAttributes(properties, nft.metadata),
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
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Update your NFT's basic details
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter NFT name"
                  />
                </div>

                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="Enter NFT symbol (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter NFT description (optional)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price (SOL)</Label>
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
                    Setting a price will automatically list your NFT. Leave empty to unlist.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Properties */}
          <PropertiesEditor
            properties={properties}
            onChange={setProperties}
          />

          {/* Legend */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Fields marked with * are required</span>
                <span>Changes will be reflected immediately on-chain</span>
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
