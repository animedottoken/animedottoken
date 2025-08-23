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
import { ArrowRight, CheckCircle, Palette, Users, Infinity, Settings, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PropertiesEditor, Property } from '@/components/PropertiesEditor';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  attributes: Property[]; // Add properties for collections
  // Error fields for validation
  mint_end_at_error?: string;
}

export const UnifiedMintInterface = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [step3Collection, setStep3Collection] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingError, setMintingError] = useState(null);
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
    <div className="flex flex-col sm:flex-row items-center justify-center mb-8 gap-2 sm:gap-0">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all
              ${activeStep >= step 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-muted-foreground text-muted-foreground'
              }
            `}>
              {activeStep > step ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <span className="font-semibold text-xs sm:text-sm">{step}</span>
              )}
            </div>
            {step < 3 && (
              <div className={`
                w-8 sm:w-16 h-0.5 mx-1 sm:mx-2
                ${activeStep > step ? 'bg-primary' : 'bg-muted-foreground/30'}
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="sm:ml-6 text-xs sm:text-sm text-muted-foreground">
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
    attributes: [], // Add properties for collections
  });

  // Keep raw string for price input to allow typing values like "0.1"
  const [mintPriceInput, setMintPriceInput] = useState<string>('');

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

    if (!formData.image_file) {
      toast.error('Collection avatar is required');
      return;
    }

    // Enforce 1-hour buffer if end time is set
    if (formData.mint_end_at) {
      const end = new Date(formData.mint_end_at);
      const minEnd = new Date(Date.now() + 60 * 60 * 1000);
      if (end <= minEnd) {
        const msg = 'End time must be at least 1 hour in the future';
        setFormData({ ...formData, mint_end_at_error: msg });
        toast.error(msg);
        return;
      }
    }

    setIsMinting(true);
    setMintingError(null);
    try {
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
        attributes: formData.attributes,
      });

      if (result.success && result.collection) {
        // Now mint the Collection NFT on-chain
        toast.success('Collection created! Now minting on-chain...');
        
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: mintResult, error: mintError } = await supabase.functions.invoke('mint-collection', {
          body: {
            collectionId: result.collection.id,
            creatorAddress: publicKey
          }
        });

        if (mintError || !mintResult?.success) {
          console.error('Minting error:', mintError || mintResult);
          setMintingError(mintError?.message || mintResult?.error || 'Failed to mint collection');
          toast.error('Collection created but failed to mint on-chain');
        } else {
          toast.success('Collection minted successfully on-chain! 🎉');
          result.collection.collection_mint_address = mintResult.collectionMintAddress;
          result.collection.verified = true;
        }

        setStep3Collection(result.collection);
        setActiveStep(4);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      let errorMessage = 'Unexpected error occurred';
      
      // Surface exact Edge Function errors
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage = error.message;
        } else if ('error' in error && error.error) {
          errorMessage = error.error;
        } else if ('details' in error && error.details) {
          errorMessage = error.details;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setMintingError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsMinting(false);
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
                  Collection Name <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground">(Required)</span> <Badge variant="secondary">On-Chain</Badge>
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
                  Symbol <Badge variant="secondary">On-Chain</Badge>
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
                  Public Description <Badge variant="outline">Off-Chain</Badge>
                </Label>
                <Textarea
                  id="site_description"
                  placeholder="Explain your collection for collectors…"
                  value={formData.site_description}
                  onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                  maxLength={2000}
                />
                <div className="text-xs text-muted-foreground">
                  This appears on your public collection page in this app. Good for long details, roadmap, utilities, links. ({formData.site_description.length}/2000)
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="onchain_description" className="text-base font-medium">
                  Short Description <Badge variant="secondary">On-Chain</Badge>
                </Label>
                <Textarea
                  id="onchain_description"
                  placeholder="Short description for on-chain metadata"
                  value={formData.onchain_description}
                  onChange={(e) => setFormData({ ...formData, onchain_description: e.target.value })}
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground">
                  Stored on-chain and shown in wallets/marketplaces. Keep it brief. ({formData.onchain_description.length}/200)
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
                    Max Supply <Badge variant="secondary">On-Chain</Badge>
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
                  Mint End Date & Time (Optional) <Badge variant="outline">Off-Chain</Badge>
                </Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !formData.mint_end_at && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.mint_end_at ? (
                          new Date(formData.mint_end_at).toLocaleDateString()
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.mint_end_at ? new Date(formData.mint_end_at) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Don't validate date alone - only validate combined date+time
                            // Keep existing time or set to end of day if new date
                            let timeString = '23:59';
                            if (formData.mint_end_at) {
                              const existing = new Date(formData.mint_end_at);
                              timeString = existing.toTimeString().slice(0, 5);
                            }
                            
                            const [hours, minutes] = timeString.split(':');
                            date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                            
                            // Now validate the combined date+time with 1-hour buffer
                            const now = new Date();
                            const minEnd = new Date(now.getTime() + 60 * 60 * 1000);
                            if (date <= minEnd) {
                              setFormData({ 
                                ...formData, 
                                mint_end_at_error: 'End time must be at least 1 hour in the future'
                              });
                              return;
                            }
                            
                            setFormData({ 
                              ...formData, 
                              mint_end_at: date.toISOString(),
                              mint_end_at_error: undefined
                            });
                          }
                        }}
                        disabled={(date) => { 
                          const today = new Date(); 
                          today.setHours(0,0,0,0); 
                          return date < today; 
                        }}
                        fromDate={new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                   <div className="flex items-center gap-2">
                     {/* Hours */}
                     <Select
                       value={formData.mint_end_at ? String(new Date(formData.mint_end_at).getHours()).padStart(2, '0') : '23'}
                       onValueChange={(hour) => {
                         const date = formData.mint_end_at ? new Date(formData.mint_end_at) : new Date();
                         const minutes = date.getMinutes() || 59;
                         date.setHours(parseInt(hour), minutes, 0, 0);
                         
                         // Validate combined date+time with 1-hour buffer
                         const now = new Date();
                         const minEnd = new Date(now.getTime() + 60 * 60 * 1000);
                         if (date <= minEnd) {
                           setFormData({ 
                             ...formData, 
                             mint_end_at_error: 'End time must be at least 1 hour in the future'
                           });
                           return;
                         }
                         
                         setFormData({ 
                           ...formData, 
                           mint_end_at: date.toISOString(),
                           mint_end_at_error: undefined
                         });
                       }}
                     >
                       <SelectTrigger className="w-20">
                         <SelectValue placeholder="HH" />
                       </SelectTrigger>
                       <SelectContent className="z-50 max-h-60">
                         {Array.from({ length: 24 }).map((_, i) => {
                           const v = String(i).padStart(2, '0');
                           return (
                             <SelectItem key={v} value={v}>{v}</SelectItem>
                           );
                         })}
                       </SelectContent>
                     </Select>
 
                     <span className="text-muted-foreground">:</span>
 
                     {/* Minutes */}
                     <Select
                       value={formData.mint_end_at ? String(new Date(formData.mint_end_at).getMinutes()).padStart(2, '0') : '59'}
                       onValueChange={(minute) => {
                         const date = formData.mint_end_at ? new Date(formData.mint_end_at) : new Date();
                         const hours = date.getHours() || 23;
                         date.setHours(hours, parseInt(minute), 0, 0);
                         
                         // Validate combined date+time with 1-hour buffer
                         const now = new Date();
                         const minEnd = new Date(now.getTime() + 60 * 60 * 1000);
                         if (date <= minEnd) {
                           setFormData({ 
                             ...formData, 
                             mint_end_at_error: 'End time must be at least 1 hour in the future'
                           });
                           return;
                         }
                         
                         setFormData({ 
                           ...formData, 
                           mint_end_at: date.toISOString(),
                           mint_end_at_error: undefined
                         });
                       }}
                     >
                       <SelectTrigger className="w-20">
                         <SelectValue placeholder="MM" />
                       </SelectTrigger>
                       <SelectContent className="z-50 max-h-60">
                         {Array.from({ length: 60 }).map((_, i) => {
                           const v = String(i).padStart(2, '0');
                           return (
                             <SelectItem key={v} value={v}>{v}</SelectItem>
                           );
                         })}
                       </SelectContent>
                     </Select>
                     
                     <span className="text-xs text-muted-foreground ml-2">
                       {Intl.DateTimeFormat().resolvedOptions().timeZone}
                     </span>
                   </div>
                </div>
                {formData.mint_end_at_error && (
                  <div className="text-sm text-destructive font-medium">
                    ⚠️ Important: {formData.mint_end_at_error}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {formData.supply_mode === 'open' 
                    ? "Set exactly when to stop minting this open edition"
                    : "Optionally set a deadline for minting with specific time"
                  }
                </div>
                {formData.mint_end_at && (
                  <div className="text-xs text-muted-foreground">
                    Will close at: {new Date(formData.mint_end_at).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-medium">
                  Category <Badge variant="outline">Off-Chain</Badge>
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
              <div className="space-y-6 pt-4 border-t">
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

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable_primary_sales"
                      checked={formData.enable_primary_sales}
                      onCheckedChange={(checked) => setFormData({ ...formData, enable_primary_sales: checked })}
                    />
                    <Label htmlFor="enable_primary_sales" className="text-base font-medium">
                      List for sale immediately after minting
                    </Label>
                  </div>

                  {formData.enable_primary_sales && (
                    <div className="ml-6 space-y-3">
                      <Label htmlFor="mint_price_input" className="text-base font-medium">
                        Price (SOL) <span className="text-destructive">*</span> <Badge variant="secondary">On-Chain</Badge>
                      </Label>
                      <Input
                        id="mint_price_input"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.1"
                        value={mintPriceInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setMintPriceInput(val);
                          }
                        }}
                        onBlur={() => {
                          const parsed = parseFloat((mintPriceInput || '0').replace(',', '.'));
                          const safe = isNaN(parsed) || parsed < 0 ? 0 : parsed;
                          setFormData({ ...formData, mint_price: safe });
                          setMintPriceInput(safe.toString());
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Set the initial listing price for NFTs from this collection
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Properties Section */}
              <PropertiesEditor
                properties={formData.attributes}
                onChange={(properties) => setFormData({ ...formData, attributes: properties })}
                className="mt-6"
              />

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setActiveStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setActiveStep(2)} disabled={!formData.name.trim()}>
                  Next: Upload Images
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
                  Collection Avatar <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground">(Required)</span> <Badge variant="secondary">On-Chain</Badge>
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
                  Collection Banner <span className="text-xs text-muted-foreground">(Optional)</span> <Badge variant="outline">Off-Chain</Badge>
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

                {/* Mint price configured in Step 1 to avoid duplication */}

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Royalties (%) <Badge variant="secondary">On-Chain</Badge>
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
                  Treasury Wallet <Badge variant="secondary">On-Chain</Badge>
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
                <Button onClick={() => setActiveStep(3)} disabled={!formData.image_file}>
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
                      <Label className="text-base font-medium">Public description</Label>
                      <div className="text-sm text-muted-foreground leading-relaxed">{formData.site_description}</div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium">Description (On-Chain)</Label>
                      <div className="text-sm text-muted-foreground leading-relaxed">{formData.onchain_description}</div>
                    </div>
                   </div>

                   {/* Mint End Time Warning */}
                   {formData.mint_end_at && (
                     <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                       <div className="flex items-start gap-2">
                         <div className="text-warning font-medium">⚠️ Important:</div>
                         <div className="text-sm">
                           Mint will automatically close at {new Date(formData.mint_end_at).toLocaleString()}
                         </div>
                       </div>
                     </div>
                   )}
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
                 <Button 
                   onClick={handleSubmit} 
                   size="lg"
                   disabled={!!formData.mint_end_at_error || isMinting || !formData.image_file}
                 >
                  {isMinting ? 'Creating & Minting...' : 'Create Collection + Mint NFT'}
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
                    Collection {step3Collection?.verified ? 'Created & Minted Successfully!' : 'Created Successfully!'}
                  </CardTitle>
                  {mintingError && (
                    <div className="text-sm text-destructive mt-2">
                      Minting Error: {mintingError}
                    </div>
                  )}
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
                        <Badge variant={step3Collection?.verified ? 'default' : 'secondary'}>
                          {step3Collection?.verified ? 'Verified ✓' : 'Draft'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Supply</div>
                        <div className="font-bold">
                          {step3Collection?.supply_mode === 'open' ? '∞' : step3Collection?.max_supply}
                        </div>
                      </div>
                    </div>
                    
                    {step3Collection?.collection_mint_address && (
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="text-sm text-muted-foreground">Collection Mint Address</div>
                        <div className="font-mono text-xs break-all bg-background p-2 rounded border mt-1">
                          {step3Collection.collection_mint_address}
                        </div>
                      </div>
                    )}
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
