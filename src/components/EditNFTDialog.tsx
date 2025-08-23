import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { UserNFT } from "@/hooks/useUserNFTs";

interface EditNFTDialogProps {
  nft: UserNFT;
  onUpdate?: () => void;
}

interface Property {
  trait_type: string;
  value: string;
}

export function EditNFTDialog({ nft, onUpdate }: EditNFTDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: nft.name,
    description: nft.description || '',
    symbol: nft.symbol || '',
  });
  const [properties, setProperties] = useState<Property[]>(
    Array.isArray(nft.metadata) 
      ? nft.metadata.map(attr => ({ trait_type: attr.trait_type, value: attr.value }))
      : []
  );

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: nft.name,
        description: nft.description || '',
        symbol: nft.symbol || '',
      });
      setProperties(
        Array.isArray(nft.metadata) 
          ? nft.metadata.map(attr => ({ trait_type: attr.trait_type, value: attr.value }))
          : []
      );
    }
  }, [isOpen, nft]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);

    try {
      // Update NFT in database
      const { error } = await supabase
        .from('nfts')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          symbol: formData.symbol.trim() || null,
          attributes: properties.length > 0 ? properties as any : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', nft.id);

      if (error) throw error;

      toast.success('NFT updated successfully!');
      setIsOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating NFT:', error);
      toast.error('Failed to update NFT');
    } finally {
      setLoading(false);
    }
  };

  const addProperty = () => {
    setProperties([...properties, { trait_type: '', value: '' }]);
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const updateProperty = (index: number, field: keyof Property, value: string) => {
    const updated = properties.map((prop, i) => 
      i === index ? { ...prop, [field]: value } : prop
    );
    setProperties(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit NFT</DialogTitle>
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

          {/* Basic Information */}
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
          </div>

          {/* Properties */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Properties</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProperty}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Property
              </Button>
            </div>

            <div className="space-y-3">
              {properties.map((property, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Trait type"
                    value={property.trait_type}
                    onChange={(e) => updateProperty(index, 'trait_type', e.target.value)}
                  />
                  <Input
                    placeholder="Value"
                    value={property.value}
                    onChange={(e) => updateProperty(index, 'value', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProperty(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {properties.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                <p>No properties added yet.</p>
                <p className="text-sm">Properties help describe unique traits of your NFT.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
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