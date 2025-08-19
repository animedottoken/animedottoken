import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Plus, 
  Palette, 
  Settings, 
  Coins,
  Zap,
  FileImage
} from 'lucide-react';
import { SolanaWalletButton } from '@/components/SolanaWalletButton';
import { useCollections, type CreateCollectionData } from '@/hooks/useCollections';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useToast } from '@/hooks/use-toast';
import { MintingInterface } from '@/components/MintingInterface';

export const UnifiedMintInterface = () => {
  const { connected, publicKey } = useSolanaWallet();
  const { creating, createCollection } = useCollections();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'collection' | 'standalone'>('collection');
  const [createdCollectionId, setCreatedCollectionId] = useState<string | null>(null);

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

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      return;
    }

    const result = await createCollection({
      ...formData,
      image_file: imageFile || undefined,
    });

    if (result && (result as any).success && (result as any).collection) {
      const collectionId = (result as any).collection.id;
      setCreatedCollectionId(collectionId);
      
      toast({
        title: 'Collection created successfully!',
        description: 'You can now mint NFTs from your collection.',
      });
    } else {
      toast({
        title: 'Failed to create collection',
        description: ((result as any)?.error?.message) || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const resetCollection = () => {
    setCreatedCollectionId(null);
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
  };

  if (!connected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your Solana wallet to start minting NFTs or creating collections.
            </p>
            <div className="pr-16">
              <SolanaWalletButton />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If collection is created, show minting interface
  if (createdCollectionId) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                🎉 Collection Created Successfully!
              </CardTitle>
              <p className="text-muted-foreground">
                Your collection "{formData.name}" is ready. You can now mint NFTs from it.
              </p>
            </div>
            <Button variant="outline" onClick={resetCollection}>
              Create Another
            </Button>
          </CardHeader>
        </Card>
        
        <MintingInterface collectionId={createdCollectionId} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'collection' | 'standalone')}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="collection" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Collection & Mint
          </TabsTrigger>
          <TabsTrigger value="standalone" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Mint Standalone NFT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Plus className="h-6 w-6" />
                Create Collection & Mint NFTs
                <Badge variant="secondary" className="ml-2">Recommended</Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                Create a collection series and mint your first NFT. Perfect for launching a complete NFT project.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <form onSubmit={handleCreateCollection} className="space-y-8">
                
                {/* Collection Banner & Avatar */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <Label className="text-lg font-semibold">Collection Artwork</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Avatar (Square) */}
                    <div>
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                          <AspectRatio ratio={1}>
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Collection avatar"
                                className="h-full w-full object-cover rounded-md"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-center bg-muted/20">
                                <div>
                                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm font-medium">Avatar</p>
                                  <p className="text-xs text-muted-foreground">1000x1000px, 5mb max</p>
                                </div>
                              </div>
                            )}
                          </AspectRatio>
                        </div>
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Image Guidelines:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>Avatar:</strong> 1000x1000px (square format)</li>
                        <li>• <strong>Banner:</strong> 1440x460px (coming soon)</li>
                        <li>• File formats: JPG, PNG, GIF, WEBP</li>
                        <li>• Maximum file size: 5MB</li>
                        <li>• High quality for marketplace display</li>
                      </ul>
                      <div className="p-3 bg-primary/10 rounded-md">
                        <p className="text-xs text-primary font-medium">
                          💡 Tip: Square avatars work best across all marketplaces and social platforms
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Series Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <Label className="text-lg font-semibold">Series Information</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Series Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., ANIME Community Campaigns"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="symbol">Symbol *</Label>
                      <Input
                        id="symbol"
                        value={formData.symbol}
                        onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                        placeholder="e.g., ACC"
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
                      placeholder="The ANIME Community Campaigns series immortalizes key moments and achievements from our community's journey..."
                      className="h-32"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.description.length}/1000 characters
                    </p>
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
                        placeholder="0.1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="max_supply">Max Supply *</Label>
                      <Input
                        id="max_supply"
                        type="number"
                        min="1"
                        max="100000"
                        value={formData.max_supply}
                        onChange={(e) => setFormData({...formData, max_supply: parseInt(e.target.value) || 1})}
                        placeholder="10000"
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
                        placeholder="Your connected wallet"
                      />
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
                        Restrict minting to approved addresses only
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
                        Create Collection & Start Minting
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standalone">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Zap className="h-6 w-6" />
                Mint Standalone NFT
              </CardTitle>
              <p className="text-muted-foreground">
                Mint a single NFT without creating a collection. Perfect for one-off pieces or testing.
              </p>
            </CardHeader>
            
            <CardContent className="p-8 text-center">
              <div className="mb-8">
                <div className="text-6xl mb-4">🚧</div>
                <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Standalone NFT minting is currently under development. For now, you can create a collection with a single NFT.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('collection')}
                  className="mt-4"
                >
                  Create Collection Instead
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};