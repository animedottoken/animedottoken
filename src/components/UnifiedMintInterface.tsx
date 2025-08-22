import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from "@/components/ui/slider";
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { useCollections } from '@/hooks/useCollections';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { ArrowRight, CheckCircle, Palette, Users, Infinity, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FormData {
  name: string;
  symbol: string;
  site_description: string;
  onchain_description: string;
  image_file: File | null;
  banner_file: File | null;
  external_links: { type: string; url: string }[];
  category: string;
  explicit_content: boolean;
  enable_primary_sales: boolean;
  mint_price: number;
  supply_mode: string; // Add supply mode
  max_supply: number;
  royalty_percentage: number;
  treasury_wallet: string;
  whitelist_enabled: boolean;
  go_live_date: string;
  mint_end_at: string; // Add mint end date
  locked_fields: string[]; // Add locked fields
}

export const UnifiedMintInterface = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [step3Collection, setStep3Collection] = useState(null);
  const { createCollection } = useCollections({ suppressErrors: true });
  const { publicKey } = useSolanaWallet();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when step changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStep]);

  // Step indicator component
  const TOTAL_STEPS = 3;
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
              ${activeStep >= step 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-muted-foreground text-muted-foreground'
              }
            `}>
              {activeStep > step ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="font-semibold">{step}</span>
              )}
            </div>
            {step < 3 && (
              <div className={`
                w-16 h-0.5 mx-2
                ${activeStep > step ? 'bg-primary' : 'bg-muted-foreground/30'}
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="ml-6 text-sm text-muted-foreground">
        Step {activeStep} of {TOTAL_STEPS}
      </div>
    </div>
  );

  const [formData, setFormData] = useState<FormData>({
    name: '',
    symbol: '',
    site_description: '',
    onchain_description: '',
    image_file: null,
    banner_file: null,
    external_links: [],
    category: '',
    explicit_content: false,
    enable_primary_sales: true,
    mint_price: 0,
    supply_mode: 'fixed', // Add supply mode
    max_supply: 1000,
    royalty_percentage: 0,
    treasury_wallet: '',
    whitelist_enabled: false,
    go_live_date: '',
    mint_end_at: '', // Add mint end date
    locked_fields: [], // Add locked fields
  });

  const handleSubmit = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    // Create collection
    const result = await createCollection({
      ...formData,
      name: formData.name,
      symbol: formData.symbol,
      site_description: formData.site_description,
      onchain_description: formData.onchain_description,
      image_file: formData.image_file,
      banner_file: formData.banner_file,
      external_links: formData.external_links,
      category: formData.category,
      explicit_content: formData.explicit_content,
      enable_primary_sales: formData.enable_primary_sales,
      mint_price: formData.mint_price,
      max_supply: formData.max_supply,
      royalty_percentage: formData.royalty_percentage,
      treasury_wallet: formData.treasury_wallet || publicKey,
      whitelist_enabled: formData.whitelist_enabled,
      go_live_date: formData.go_live_date,
      mint_end_at: formData.mint_end_at,
      supply_mode: formData.supply_mode,
      locked_fields: formData.locked_fields,
    });

    if (result.success && result.collection) {
      setStep3Collection(result.collection);
      setActiveStep(4);
    }
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto">
      {activeStep <= TOTAL_STEPS && <StepIndicator />}
      
      {activeStep === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-6 w-6" />
                Collection Basics
              </CardTitle>
              <p className="text-muted-foreground">
                Start by setting up your collection's basic information and branding.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-base font-medium">
                  Collection Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="My Awesome NFT Collection"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <div className="text-xs text-muted-foreground">
                  Name of your collection (visible on marketplaces)
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="symbol" className="text-base font-medium">
                  Symbol
                </Label>
                <Input
                  id="symbol"
                  type="text"
                  placeholder="AWESOME"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                />
                <div className="text-xs text-muted-foreground">
                  Short symbol for your collection (e.g., AWESOME)
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="site_description" className="text-base font-medium">
                  Description (Website)
                </Label>
                <Textarea
                  id="site_description"
                  placeholder="Detailed description of your collection for website display"
                  value={formData.site_description}
                  onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                />
                <div className="text-xs text-muted-foreground">
                  Detailed description of your collection (visible on your website)
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="onchain_description" className="text-base font-medium">
                  Description (On-Chain)
                </Label>
                <Textarea
                  id="onchain_description"
                  placeholder="Short description for on-chain metadata"
                  value={formData.onchain_description}
                  onChange={(e) => setFormData({ ...formData, onchain_description: e.target.value })}
                />
                <div className="text-xs text-muted-foreground">
                  Short description stored on-chain (visible on marketplaces)
                </div>
              </div>

              {/* Supply Mode Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Supply Mode</Label>
                <Select 
                  value={formData.supply_mode} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    supply_mode: value,
                    max_supply: value === 'open' ? 0 : formData.max_supply
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Fixed Supply</div>
                          <div className="text-xs text-muted-foreground">Set a specific number of NFTs</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="open">
                      <div className="flex items-center gap-2">
                        <Infinity className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Open Edition ∞</div>
                          <div className="text-xs text-muted-foreground">Unlimited NFTs (like major drops)</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  {formData.supply_mode === 'open' 
                    ? "Open editions allow unlimited minting, perfect for community drops or utility tokens."
                    : "Fixed supply creates scarcity with a set maximum number of NFTs."
                  }
                </div>
              </div>

              {/* Max Supply - only show for fixed mode */}
              {formData.supply_mode === 'fixed' && (
                <div className="space-y-3">
                  <Label htmlFor="max_supply" className="text-base font-medium">
                    Max Supply
                  </Label>
                  <Input
                    id="max_supply"
                    type="number"
                    min="1"
                    max="100000"
                    value={formData.max_supply === 0 ? '' : formData.max_supply}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData({ ...formData, max_supply: 0 });
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue)) {
                          setFormData({ ...formData, max_supply: numValue });
                        }
                      }
                    }}
                    placeholder="1000"
                  />
                  <div className="text-xs text-muted-foreground">
                    Total number of NFTs that can be minted (1-100,000)
                  </div>
                </div>
              )}

              {/* Optional Mint End Date */}
              <div className="space-y-3">
                <Label htmlFor="mint_end_at" className="text-base font-medium">
                  Mint End Date (Optional)
                </Label>
                <Input
                  id="mint_end_at"
                  type="datetime-local"
                  value={formData.mint_end_at}
                  onChange={(e) => setFormData({ ...formData, mint_end_at: e.target.value })}
                />
                <div className="text-xs text-muted-foreground">
                  {formData.supply_mode === 'open' 
                    ? "Set when to stop minting this open edition"
                    : "Optionally set a deadline for minting"
                  }
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-medium">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Art">Art</SelectItem>
                    <SelectItem value="Gaming">Gaming</SelectItem>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Utility">Utility</SelectItem>
                    <SelectItem value="Profile Pictures">Profile Pictures</SelectItem>
                    <SelectItem value="Collectibles">Collectibles</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Category of your collection
                </div>
              </div>

              {/* Content & Listing Options */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="explicit_content"
                    checked={formData.explicit_content}
                    onCheckedChange={(checked) => setFormData({ ...formData, explicit_content: checked })}
                  />
                  <Label htmlFor="explicit_content" className="text-base font-medium">
                    Contains explicit or sensitive content
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_primary_sales"
                    checked={formData.enable_primary_sales}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_primary_sales: checked })}
                  />
                  <Label htmlFor="enable_primary_sales" className="text-base font-medium">
                    Enable primary sales (list NFTs for sale immediately after minting)
                  </Label>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setActiveStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setActiveStep(2)} disabled={!formData.name.trim()}>
                  Next: Settings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
      )}

      {activeStep === 2 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Collection Settings
              </CardTitle>
              <p className="text-muted-foreground">
                Configure advanced settings for your collection.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Collection Avatar
                </Label>
                <FileUpload
                  onFileSelect={(file) => setFormData({ ...formData, image_file: file })}
                  currentFile={formData.image_file}
                  placeholder="Click to upload collection logo"
                  aspectRatio={1}
                  maxSizeText="JPG, PNG, GIF, WEBP • Max 10MB"
                />
                <div className="text-xs text-muted-foreground">
                  Upload a logo for your collection
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Collection Banner
                </Label>
                <FileUpload
                  onFileSelect={(file) => setFormData({ ...formData, banner_file: file })}
                  currentFile={formData.banner_file}
                  placeholder="Click to upload banner image"
                  aspectRatio={3}
                  maxSizeText="JPG, PNG, GIF, WEBP • Max 10MB"
                />
                <div className="text-xs text-muted-foreground">
                  Upload a banner image for your collection
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="mint_price" className="text-base font-medium">
                  Mint Price (SOL)
                </Label>
                <Input
                  id="mint_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.mint_price}
                  onChange={(e) => setFormData({ ...formData, mint_price: parseFloat(e.target.value) || 0 })}
                />
                <div className="text-xs text-muted-foreground">
                  Price per NFT in SOL
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Royalties (%)
                </Label>
                <div className="space-y-3">
                  <Slider
                    value={[formData.royalty_percentage]}
                    max={50}
                    step={0.01}
                    onValueChange={(value) => setFormData({ ...formData, royalty_percentage: value[0] })}
                    className="w-full"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      step="0.01"
                      value={formData.royalty_percentage.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const clamped = Math.max(0, Math.min(50, value));
                        setFormData({ ...formData, royalty_percentage: clamped });
                      }}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Percentage of royalties on secondary sales (0-50%)
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="treasury_wallet" className="text-base font-medium">
                  Treasury Wallet
                </Label>
                <Input
                  id="treasury_wallet"
                  type="text"
                  placeholder={publicKey || "Connect wallet"}
                  value={formData.treasury_wallet || publicKey || ''}
                  onChange={(e) => setFormData({ ...formData, treasury_wallet: e.target.value })}
                  disabled={!!publicKey}
                />
                <div className="text-xs text-muted-foreground">
                  Wallet address to receive royalties
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="whitelist_enabled" className="text-base font-medium">
                  Whitelist Enabled
                </Label>
                <Switch
                  id="whitelist_enabled"
                  checked={formData.whitelist_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, whitelist_enabled: checked })}
                />
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setActiveStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setActiveStep(3)}>
                  Next: Review
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
      )}

      {activeStep === 3 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Review Collection Details
              </CardTitle>
              <p className="text-muted-foreground">
                Please review the details of your collection before submitting.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Collection Details */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Collection Name</Label>
                      <div className="text-lg font-semibold">{formData.name}</div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium">Symbol</Label>
                      <div className="text-sm text-muted-foreground">{formData.symbol}</div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium">Category</Label>
                      <div className="text-sm">{formData.category}</div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium">Description (Website)</Label>
                      <div className="text-sm text-muted-foreground leading-relaxed">{formData.site_description}</div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium">Description (On-Chain)</Label>
                      <div className="text-sm text-muted-foreground leading-relaxed">{formData.onchain_description}</div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Settings & Images */}
                <div className="space-y-6">
                  {/* Collection Images */}
                  <div className="space-y-4">
                    {formData.image_file && (
                      <div>
                        <Label className="text-base font-medium">Collection Avatar</Label>
                        <img 
                          src={URL.createObjectURL(formData.image_file)} 
                          alt="Collection avatar preview"
                          className="w-20 h-20 rounded-lg object-cover mt-2"
                        />
                      </div>
                    )}
                    
                    {formData.banner_file && (
                      <div>
                        <Label className="text-base font-medium">Collection Banner</Label>
                        <img 
                          src={URL.createObjectURL(formData.banner_file)} 
                          alt="Collection banner preview"
                          className="w-full h-20 rounded-lg object-cover mt-2"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Key Settings Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-sm text-muted-foreground">Mint Price</Label>
                      <div className="font-semibold">{formData.mint_price} SOL</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Royalties</Label>
                      <div className="font-semibold">{formData.royalty_percentage.toFixed(2)}%</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Supply</Label>
                      <div className="font-semibold">
                        {formData.supply_mode === 'open' ? '∞ Open' : `${formData.max_supply} Max`}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Whitelist</Label>
                      <div className="font-semibold">{formData.whitelist_enabled ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium">Treasury Wallet</Label>
                    <div className="text-xs font-mono bg-muted/50 p-2 rounded mt-1">
                      {formData.treasury_wallet || publicKey}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-8 border-t mt-8">
                <Button variant="outline" onClick={() => setActiveStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} size="lg">
                  Create Collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
      )}

      {activeStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Collection Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Collection Created Successfully!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {step3Collection?.image_url && (
                        <img 
                          src={step3Collection.image_url} 
                          alt={step3Collection?.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{step3Collection?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {step3Collection?.supply_mode === 'open' ? 'Open Edition ∞' : `${step3Collection?.max_supply} NFTs max`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">Mint Price</div>
                        <div className="font-bold">{step3Collection?.mint_price} SOL</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Royalties</div>
                        <div className="font-bold">{step3Collection?.royalty_percentage}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <Badge variant={step3Collection?.is_live ? 'default' : 'secondary'}>
                          {step3Collection?.is_live ? 'Live' : 'Draft'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Supply</div>
                        <div className="font-bold">
                          {step3Collection?.supply_mode === 'open' ? '∞' : step3Collection?.max_supply}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - NFT Details & Minting Interface */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Next Step</CardTitle>
                  <CardDescription>What would you like to do next?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => navigate(`/mint/nft?collection=${step3Collection?.id}`)}
                      className="w-full"
                    >
                      🎨 Mint your NFT from this collection
                    </Button>
                    <Button variant="outline" onClick={handleGoToProfile} className="w-full">
                      Go to Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>
      )}
    </div>
  );
};
