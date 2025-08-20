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
import { validateImageFile, validateCollectionData, areRequiredFieldsValid, validateStandaloneNFTData } from '@/utils/validation';
import { useStandaloneMint, type StandaloneNFTData } from '@/hooks/useStandaloneMint';

export const UnifiedMintInterface = () => {
  const { connected, publicKey } = useSolanaWallet();
  const { creating, createCollection } = useCollections();
  const { minting, mintStandaloneNFT } = useStandaloneMint();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'collection' | 'standalone'>('collection');
  const [createdCollectionId, setCreatedCollectionId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState<CreateCollectionData>({
    name: '',
    symbol: '',
    site_description: '',
    onchain_description: '',
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

  // Standalone NFT form data
  const [standaloneData, setStandaloneData] = useState<StandaloneNFTData>({
    name: '',
    symbol: '',
    description: '',
    quantity: 1,
    royalty_percentage: 5,
    category: '',
    external_links: [],
    attributes: []
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Standalone NFT image state
  const [standaloneImageFile, setStandaloneImageFile] = useState<File | null>(null);
  const [standaloneImagePreview, setStandaloneImagePreview] = useState<string | null>(null);

  // Update treasury wallet when wallet connects
  React.useEffect(() => {
    if (publicKey) {
      setFormData(prev => ({ ...prev, treasury_wallet: publicKey }));
    }
  }, [publicKey]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          title: 'Invalid image file',
          description: validation.error,
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate banner file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          title: 'Invalid banner file',
          description: validation.error,
          variant: 'destructive',
        });
        return;
      }

      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStandaloneImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          title: 'Invalid image file',
          description: validation.error,
          variant: 'destructive',
        });
        return;
      }

      setStandaloneImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setStandaloneImagePreview(reader.result as string);
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

    // Validate collection data
    const validationErrors = validateCollectionData(formData);
    if (validationErrors.length > 0) {
      // Show first error
      const firstError = validationErrors[0];
      toast({
        title: `Invalid ${firstError.field}`,
        description: firstError.message,
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

  const handleMintStandalone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      return;
    }

    // Validate standalone NFT data
    const validationErrors = validateStandaloneNFTData(standaloneData);
    if (validationErrors.length > 0) {
      // Show first error
      const firstError = validationErrors[0];
      toast({
        title: `Invalid ${firstError.field}`,
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }

    const result = await mintStandaloneNFT({
      ...standaloneData,
      image_file: standaloneImageFile || undefined,
    });

    if (result.success) {
      // Reset form on success
      setStandaloneData({
        name: '',
        symbol: '',
        description: '',
        quantity: 1,
        royalty_percentage: 5,
        category: '',
        external_links: [],
        attributes: []
      });
      setStandaloneImageFile(null);
      setStandaloneImagePreview(null);
    }
  };

  const addAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    setStandaloneData(prev => ({
      ...prev,
      attributes: [...(prev.attributes || []), { trait_type: '', value: '' }]
    }));
  };

  const removeAttribute = (index: number) => {
    setStandaloneData(prev => ({
      ...prev,
      attributes: prev.attributes?.filter((_, i) => i !== index) || []
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setStandaloneData(prev => ({
      ...prev,
      attributes: prev.attributes?.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      ) || []
    }));
  };

  const resetCollection = () => {
    setCreatedCollectionId(null);
    setFormData({
      name: '',
      symbol: '',
      site_description: '',
      onchain_description: '',
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
      {/* Choose Your Path Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-lg border border-border/20">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Choose Your Path</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Collections are optional containers that help organize your NFTs. You can mint NFTs immediately without creating a collection first.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant={activeTab === 'collection' ? 'default' : 'outline'}
              onClick={() => setActiveTab('collection')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Collection First
            </Button>
            <Button 
              variant={activeTab === 'standalone' ? 'default' : 'outline'}
              onClick={() => setActiveTab('standalone')}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Skip & Mint NFT Now
            </Button>
          </div>
        </div>
      </div>

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
              <div className="p-3 bg-accent/10 rounded-md mt-4">
                <p className="text-sm text-accent-foreground">
                  ℹ️ <strong>Important:</strong> Creating a collection does not mint NFTs. It sets up a container with rules (price, supply, royalties) for organizing your NFTs.
                </p>
              </div>
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
                      <Label htmlFor="name">
                        Collection Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., My Art Series"
                        minLength={3}
                        maxLength={32}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formData.name || '').length}/32 characters (min: 3)
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
                      <p className="text-xs text-muted-foreground mt-1">2-10 characters if provided</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="site-description">Site Description (Optional)</Label>
                    <Textarea
                      id="site-description"
                      value={formData.site_description}
                      onChange={(e) => setFormData({...formData, site_description: e.target.value})}
                      placeholder="Describe your collection for marketplace display..."
                      className="h-24"
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(formData.site_description || '').length}/2000 characters - Shown on marketplace
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="onchain-description">On-Chain Description (Optional)</Label>
                    <Textarea
                      id="onchain-description"
                      value={formData.onchain_description}
                      onChange={(e) => setFormData({...formData, onchain_description: e.target.value})}
                      placeholder="Brief description stored on blockchain..."
                      className="h-16"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(formData.onchain_description || '').length}/200 characters - Stored permanently on-chain
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
                        <SelectItem value="collectibles">Collectibles</SelectItem>
                        <SelectItem value="pfp">Profile Pictures (PFP)</SelectItem>
                        <SelectItem value="photography">Photography</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="domains">Domain Names</SelectItem>
                        <SelectItem value="metaverse">Metaverse</SelectItem>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="trading-cards">Trading Cards</SelectItem>
                        <SelectItem value="virtual-worlds">Virtual Worlds</SelectItem>
                        <SelectItem value="meme">Meme</SelectItem>
                        <SelectItem value="ai-art">AI Art</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
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
                      <Label htmlFor="twitter">Twitter/X</Label>
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

                    <div>
                      <Label htmlFor="telegram">Telegram</Label>
                      <Input
                        id="telegram"
                        placeholder="https://t.me/username"
                        value={formData.external_links?.find(l => l.type === 'telegram')?.url || ''}
                        onChange={(e) => handleSocialLinkChange('telegram', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        placeholder="https://facebook.com/page"
                        value={formData.external_links?.find(l => l.type === 'facebook')?.url || ''}
                        onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        placeholder="https://youtube.com/channel"
                        value={formData.external_links?.find(l => l.type === 'youtube')?.url || ''}
                        onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="medium">Medium</Label>
                      <Input
                        id="medium"
                        placeholder="https://medium.com/@username"
                        value={formData.external_links?.find(l => l.type === 'medium')?.url || ''}
                        onChange={(e) => handleSocialLinkChange('medium', e.target.value)}
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
                            <Label htmlFor="max-supply">
                              Max Supply <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="max-supply"
                              type="number"
                              min="1"
                              max="100000"
                              value={formData.max_supply}
                              onChange={(e) => setFormData({...formData, max_supply: parseInt(e.target.value) || 0})}
                              required={formData.enable_primary_sales}
                            />
                            <p className="text-xs text-muted-foreground mt-1">1-100,000 NFTs</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="royalties">Royalties (%)</Label>
                            <Input
                              id="royalties"
                              type="number"
                              min="0"
                              max="20"
                              step="0.1"
                              value={formData.royalty_percentage}
                              onChange={(e) => setFormData({...formData, royalty_percentage: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-xs text-muted-foreground mt-1">0-20% on secondary sales</p>
                          </div>
                          <div>
                            <Label htmlFor="treasury">
                              Treasury Wallet <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="treasury"
                              value={formData.treasury_wallet}
                              onChange={(e) => setFormData({...formData, treasury_wallet: e.target.value})}
                              placeholder="Wallet address for payments"
                              required={formData.enable_primary_sales}
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
                  disabled={creating || !areRequiredFieldsValid(formData, formData.enable_primary_sales)}
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
                Mint NFTs immediately without creating a collection. Perfect for one-off pieces or testing.
              </p>
              <div className="p-3 bg-primary/10 rounded-md mt-4">
                <p className="text-sm text-primary">
                  ⚡ <strong>Quick Mint:</strong> This mints NFTs directly. You can assign them to a collection later if needed.
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleMintStandalone} className="space-y-6">
                
                {/* NFT Artwork */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">NFT Artwork</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="standalone-image-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                          <AspectRatio ratio={1}>
                            {standaloneImagePreview ? (
                              <img
                                src={standaloneImagePreview}
                                alt="NFT artwork"
                                className="h-full w-full object-cover rounded-md"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-center bg-muted/20">
                                <div>
                                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm font-medium">Upload Artwork</p>
                                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WEBP (5MB max)</p>
                                </div>
                              </div>
                            )}
                          </AspectRatio>
                        </div>
                      </Label>
                      <Input
                        id="standalone-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleStandaloneImageChange}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Tips:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• High-quality images work best</li>
                        <li>• Square format (1:1) recommended</li>
                        <li>• File formats: JPG, PNG, GIF, WEBP</li>
                        <li>• Maximum file size: 5MB</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Basic Information</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="standalone-name">
                        NFT Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="standalone-name"
                        value={standaloneData.name}
                        onChange={(e) => setStandaloneData({...standaloneData, name: e.target.value})}
                        placeholder="e.g., My Awesome NFT"
                        maxLength={100}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(standaloneData.name || '').length}/100 characters
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="standalone-symbol">Symbol (Optional)</Label>
                      <Input
                        id="standalone-symbol"
                        value={standaloneData.symbol}
                        onChange={(e) => setStandaloneData({...standaloneData, symbol: e.target.value.toUpperCase()})}
                        placeholder="e.g., MYNFT"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="standalone-description">Description (Optional)</Label>
                    <Textarea
                      id="standalone-description"
                      value={standaloneData.description}
                      onChange={(e) => setStandaloneData({...standaloneData, description: e.target.value})}
                      placeholder="Describe your NFT..."
                      className="h-24"
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(standaloneData.description || '').length}/1000 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="standalone-quantity">Quantity</Label>
                      <Input
                        id="standalone-quantity"
                        type="number"
                        min="1"
                        max="10"
                        value={standaloneData.quantity}
                        onChange={(e) => setStandaloneData({...standaloneData, quantity: parseInt(e.target.value) || 1})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">1-10 NFTs</p>
                    </div>

                    <div>
                      <Label htmlFor="standalone-royalty">Royalties (%)</Label>
                      <Input
                        id="standalone-royalty"
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={standaloneData.royalty_percentage}
                        onChange={(e) => setStandaloneData({...standaloneData, royalty_percentage: parseFloat(e.target.value) || 0})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="standalone-category">Category</Label>
                      <Select value={standaloneData.category} onValueChange={(value) => setStandaloneData({...standaloneData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="art">Art</SelectItem>
                          <SelectItem value="collectibles">Collectibles</SelectItem>
                          <SelectItem value="pfp">Profile Pictures (PFP)</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="meme">Meme</SelectItem>
                          <SelectItem value="ai-art">AI Art</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Attributes (Optional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Attribute
                    </Button>
                  </div>
                  
                  {standaloneData.attributes && standaloneData.attributes.length > 0 && (
                    <div className="space-y-3">
                      {standaloneData.attributes.map((attr, index) => (
                        <div key={index} className="flex gap-3 items-end">
                          <div className="flex-1">
                            <Label>Trait Type</Label>
                            <Input
                              value={attr.trait_type}
                              onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                              placeholder="e.g., Color"
                            />
                          </div>
                          <div className="flex-1">
                            <Label>Value</Label>
                            <Input
                              value={attr.value}
                              onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                              placeholder="e.g., Blue"
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeAttribute(index)}
                            className="mb-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={minting || !standaloneData.name?.trim()}
                  className="w-full h-12 text-lg font-semibold"
                >
                  {minting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Minting NFT{(standaloneData.quantity || 1) > 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Mint {(standaloneData.quantity || 1) > 1 ? `${standaloneData.quantity} NFTs` : 'NFT'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};