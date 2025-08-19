import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Loader2, Plus, Palette, Settings, Coins } from 'lucide-react';
import { useCollections, type CreateCollectionData } from '@/hooks/useCollections';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface CollectionCreatorProps {
  onCollectionCreated?: (collectionId: string) => void;
}

export const CollectionCreator = ({ onCollectionCreated }: CollectionCreatorProps) => {
  const { connected, publicKey } = useSolanaWallet();
  const { creating, createCollection } = useCollections();
  
  const [formData, setFormData] = useState<CreateCollectionData>({
    name: '',
    symbol: '',
    description: '',
    mint_price: 0,
    max_supply: 1000,
    royalty_percentage: 5,
    treasury_wallet: publicKey || '',
    whitelist_enabled: false,
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Update treasury wallet when wallet connects
  React.useEffect(() => {
    if (publicKey) {
      setFormData(prev => ({ ...prev, treasury_wallet: publicKey }));
    }
  }, [publicKey]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      return;
    }

    const result = await createCollection({
      ...formData,
      image_file: imageFile || undefined,
    });

    if (result.success && result.collection) {
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        mint_price: 0,
        max_supply: 1000,
        royalty_percentage: 5,
        treasury_wallet: publicKey || '',
        whitelist_enabled: false,
      });
      setImageFile(null);
      setImagePreview(null);
      
      onCollectionCreated?.(result.collection.id);
    }
  };

  if (!connected) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Connect your Solana wallet to start creating NFT collections.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Plus className="h-6 w-6" />
          Create NFT Collection
          <Badge variant="secondary" className="ml-2">Beta</Badge>
        </CardTitle>
        <p className="text-muted-foreground">
          Design and launch your own NFT collection with custom properties, royalties, and minting rules.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Collection Image */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">Collection Artwork</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Collection preview" 
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    ) : (
                      <div className="mb-4">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload collection image</p>
                      </div>
                    )}
                  </div>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Image Guidelines:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Recommended: 1000x1000px or larger</li>
                  <li>• Square format (1:1 aspect ratio)</li>
                  <li>• File formats: JPG, PNG, GIF, WEBP</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• High quality for best marketplace display</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">Basic Information</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Collection Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Anime Warriors"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                  placeholder="e.g., ANWA"
                  maxLength={10}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your NFT collection, its story, utility, and what makes it unique..."
                className="h-24"
                required
              />
            </div>
          </div>

          {/* Minting Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">Minting Configuration</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="mint_price">Mint Price (SOL)</Label>
                <Input
                  id="mint_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.mint_price}
                  onChange={(e) => setFormData({...formData, mint_price: parseFloat(e.target.value) || 0})}
                  placeholder="0.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set to 0 for free mint
                </p>
              </div>
              
              <div>
                <Label htmlFor="max_supply">Maximum Supply *</Label>
                <Input
                  id="max_supply"
                  type="number"
                  min="1"
                  max="100000"
                  value={formData.max_supply}
                  onChange={(e) => setFormData({...formData, max_supply: parseInt(e.target.value) || 1})}
                  placeholder="1000"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="royalty_percentage">Royalties (%)</Label>
                <Input
                  id="royalty_percentage"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={formData.royalty_percentage}
                  onChange={(e) => setFormData({...formData, royalty_percentage: parseFloat(e.target.value) || 0})}
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0-20% on secondary sales
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">Advanced Settings</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="treasury_wallet">Treasury Wallet</Label>
                <Input
                  id="treasury_wallet"
                  value={formData.treasury_wallet}
                  onChange={(e) => setFormData({...formData, treasury_wallet: e.target.value})}
                  placeholder="Where mint proceeds will be sent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Defaults to your connected wallet
                </p>
              </div>
              
              <div>
                <Label htmlFor="go_live_date">Go Live Date (Optional)</Label>
                <Input
                  id="go_live_date"
                  type="datetime-local"
                  value={formData.go_live_date || ''}
                  onChange={(e) => setFormData({...formData, go_live_date: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="whitelist_enabled" className="font-medium">
                  Enable Whitelist
                </Label>
                <p className="text-sm text-muted-foreground">
                  Restrict minting to whitelisted addresses only
                </p>
              </div>
              <Switch
                id="whitelist_enabled"
                checked={formData.whitelist_enabled}
                onCheckedChange={(checked) => setFormData({...formData, whitelist_enabled: checked})}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button 
              type="submit" 
              disabled={creating || !formData.name || !formData.symbol || !formData.description}
              className="px-8 py-3"
              size="lg"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Collection...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Collection
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};