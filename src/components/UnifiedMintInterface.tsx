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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Plus, 
  Palette,
  Zap,
  FileImage,
  Settings,
  ChevronDown,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { SolanaWalletButton } from '@/components/SolanaWalletButton';
import { useCollections, type CreateCollectionData } from '@/hooks/useCollections';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useToast } from '@/hooks/use-toast';
import { MintingInterface } from '@/components/MintingInterface';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const UnifiedMintInterface = () => {
  const { connected, publicKey } = useSolanaWallet();
  const { creating, createCollection } = useCollections();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'collection' | 'standalone'>('collection');
  const [createdCollectionId, setCreatedCollectionId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState<CreateCollectionData>({
    name: '',
    symbol: '',
    description: '',
    external_links: [],
    category: '',
    explicit_content: false,
    enable_primary_sales: false,
    mint_price: 0.1,
    max_supply: 1000,
    royalty_percentage: 5,
    treasury_wallet: publicKey || '',
    whitelist_enabled: false,
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLinkChange = (type: string, url: string) => {
    const currentLinks = formData.external_links || [];
    const existingIndex = currentLinks.findIndex(link => link.type === type);
    
    if (url.trim() === '') {
      // Remove the link if URL is empty
      const updatedLinks = currentLinks.filter(link => link.type !== type);
      setFormData({
        ...formData,
        external_links: updatedLinks
      });
    } else {
      // Add or update the link
      let updatedLinks;
      if (existingIndex >= 0) {
        updatedLinks = [...currentLinks];
        updatedLinks[existingIndex] = { type, url };
      } else {
        updatedLinks = [...currentLinks, { type, url }];
      }
      setFormData({
        ...formData,
        external_links: updatedLinks
      });
    }
  };

  const handleAddLink = () => {
    setFormData(prev => ({
      ...prev,
      external_links: [...(prev.external_links || []), { type: 'website', url: '' }]
    }));
  };

  const handleRemoveLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      external_links: prev.external_links?.filter((_, i) => i !== index) || []
    }));
  };

  const handleLinkChange = (index: number, field: 'type' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      external_links: prev.external_links?.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      ) || []
    }));
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: 'Collection name is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.name.trim().length < 3) {
      toast({
        title: 'Collection name must be at least 3 characters',
        variant: 'destructive',
      });
      return;
    }

    if (formData.name.trim().length > 20) {
      toast({
        title: 'Collection name must be 20 characters or less',
        variant: 'destructive',
      });
      return;
    }

    if (formData.description && formData.description.length > 1500) {
      toast({
        title: 'Description must be 1500 characters or less',
        variant: 'destructive',
      });
      return;
    }

    const result = await createCollection({
      ...formData,
      image_file: imageFile || undefined,
      banner_file: bannerFile || undefined,
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
      external_links: [],
      category: '',
      explicit_content: false,
      enable_primary_sales: false,
      mint_price: 0.1,
      max_supply: 1000,
      royalty_percentage: 5,
      treasury_wallet: publicKey || '',
      whitelist_enabled: false,
    });
    setImageFile(null);
    setImagePreview(null);
    setBannerFile(null);
    setBannerPreview(null);
    setShowAdvanced(false);
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
            <SolanaWalletButton />
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
                Create Collection Series
                <Badge variant="secondary" className="ml-2">Recommended</Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                Create a collection to group and organize your NFTs. Collections are like folders that help users discover and browse your work.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <form onSubmit={handleCreateCollection} className="space-y-8">
                
                {/* Collection Artwork */}
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
                                  <p className="text-sm font-medium">Avatar (Optional)</p>
                                  <p className="text-xs text-muted-foreground">Square format recommended</p>
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
                      <h4 className="font-semibold">Guidelines:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>Avatar:</strong> Square format (1:1 ratio)</li>
                        <li>• <strong>Banner:</strong> Wide format (3:1 ratio) - Optional</li>
                        <li>• File formats: JPG, PNG, GIF, WEBP</li>
                        <li>• Maximum file size: 5MB</li>
                        <li>• High quality for best display</li>
                      </ul>
                      <div className="p-3 bg-primary/10 rounded-md">
                        <p className="text-xs text-primary font-medium">
                          💡 Collections are organizational containers - you don't need perfect artwork to start!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <Label className="text-lg font-semibold">Collection Information</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Collection Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., My Art Series"
                        minLength={3}
                        maxLength={20}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formData.name || '').length}/20 characters (min: 3)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="symbol">Symbol (Optional)</Label>
                      <Input
                        id="symbol"
                        value={formData.symbol}
                        onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                        placeholder="e.g., ART"
                        maxLength={10}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Short identifier for your collection</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe your collection..."
                      className="h-24"
                      maxLength={1500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(formData.description || '').length}/1500 characters
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="art">Art</SelectItem>
                        <SelectItem value="photography">Photography</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="pfp">Profile Pictures</SelectItem>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* External Links */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">External Links (Optional)</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        value={formData.external_links?.find(l => l.type === 'website')?.url || ''}
                        onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        placeholder="https://twitter.com/username"
                        value={formData.external_links?.find(l => l.type === 'twitter')?.url || ''}
                        onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="discord">Discord</Label>
                      <Input
                        id="discord"
                        placeholder="https://discord.gg/invite"
                        value={formData.external_links?.find(l => l.type === 'discord')?.url || ''}
                        onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        placeholder="https://instagram.com/username"
                        value={formData.external_links?.find(l => l.type === 'instagram')?.url || ''}
                        onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Settings */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <Label className="text-lg font-semibold cursor-pointer">Advanced Settings</Label>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-4 mt-4">
                    {/* Primary Sales Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="enable-sales" className="font-medium">Enable Primary Sales</Label>
                        <p className="text-sm text-muted-foreground">Configure minting price, supply, and royalties for selling NFTs</p>
                      </div>
                      <Switch 
                        id="enable-sales"
                        checked={formData.enable_primary_sales}
                        onCheckedChange={(checked) => setFormData({...formData, enable_primary_sales: checked})}
                      />
                    </div>

                    {/* Primary Sales Settings */}
                    {formData.enable_primary_sales && (
                      <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="mint-price">Mint Price (SOL)</Label>
                            <Input
                              id="mint-price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.mint_price}
                              onChange={(e) => setFormData({...formData, mint_price: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="max-supply">Max Supply</Label>
                            <Input
                              id="max-supply"
                              type="number"
                              min="1"
                              value={formData.max_supply}
                              onChange={(e) => setFormData({...formData, max_supply: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="royalties">Royalties (%)</Label>
                            <Input
                              id="royalties"
                              type="number"
                              min="0"
                              max="50"
                              step="0.1"
                              value={formData.royalty_percentage}
                              onChange={(e) => setFormData({...formData, royalty_percentage: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="treasury">Treasury Wallet</Label>
                            <Input
                              id="treasury"
                              value={formData.treasury_wallet}
                              onChange={(e) => setFormData({...formData, treasury_wallet: e.target.value})}
                              placeholder="Wallet address for payments"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="whitelist" className="font-medium">Enable Whitelist</Label>
                            <p className="text-sm text-muted-foreground">Restrict minting to specific addresses</p>
                          </div>
                          <Switch 
                            id="whitelist"
                            checked={formData.whitelist_enabled}
                            onCheckedChange={(checked) => setFormData({...formData, whitelist_enabled: checked})}
                          />
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <Button 
                  type="submit" 
                  disabled={creating || !formData.name}
                  className="w-full h-12 text-lg font-semibold"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Collection...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      Create Collection
                    </>
                  )}
                </Button>
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