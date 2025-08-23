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
import { ArrowRight, CheckCircle, Palette, Users, Infinity, Settings, Calendar as CalendarIcon, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PropertiesEditor, Property } from '@/components/PropertiesEditor';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';

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
  image_preview_url: string | null;
  banner_preview_url: string | null;
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
    <div className="flex flex-col sm:flex-row items-center justify-center mb-6 sm:mb-8 gap-2 sm:gap-0 px-4">
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
    image_preview_url: null,
    banner_preview_url: null,
  });

  // Keep raw string for price input to allow typing values like "0.1"
  const [mintPriceInput, setMintPriceInput] = useState<string>('');

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (formData.image_preview_url) {
        URL.revokeObjectURL(formData.image_preview_url);
      }
      if (formData.banner_preview_url) {
        URL.revokeObjectURL(formData.banner_preview_url);
      }
    };
  }, []);

  // Maintain preview URLs when files exist but preview URLs are missing
  useEffect(() => {
    if (formData.image_file && !formData.image_preview_url) {
      const previewUrl = URL.createObjectURL(formData.image_file);
      setFormData(prev => ({ ...prev, image_preview_url: previewUrl }));
    }
    if (formData.banner_file && !formData.banner_preview_url) {
      const previewUrl = URL.createObjectURL(formData.banner_file);
      setFormData(prev => ({ ...prev, banner_preview_url: previewUrl }));
    }
  }, [formData.image_file, formData.banner_file, formData.image_preview_url, formData.banner_preview_url]);

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

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  const handleCreateAnother = () => {
    // Reset form and go back to step 1
    setFormData({
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
      supply_mode: 'fixed',
      max_supply: 1000,
      royalty_percentage: 0,
      treasury_wallet: '',
      whitelist_enabled: false,
      go_live_date: '',
      mint_end_at: '',
      locked_fields: [],
      attributes: [],
      image_preview_url: null,
      banner_preview_url: null,
    });
    setMintPriceInput('');
    setStep3Collection(null);
    setActiveStep(1);
    toast.success('Ready to create another collection!');
  };

  return (
    <div ref={containerRef} className="w-full px-4 sm:px-6 lg:px-8">
      {activeStep <= TOTAL_STEPS && <StepIndicator />}
      
      {activeStep === 1 && (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Palette className="h-5 w-5 sm:h-6 sm:w-6" />
                Collection Basics
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Start by setting up your collection's basic information and branding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="name" className="text-sm sm:text-base font-medium">
                  Collection Name <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground">(Required)</span> <Badge variant="secondary" className="ml-1">On-Chain</Badge>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="My Awesome NFT Collection"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-sm sm:text-base"
                />
                <div className="text-xs text-muted-foreground">
                  Name of your collection (visible on marketplaces)
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="symbol" className="text-sm sm:text-base font-medium">
                  Symbol <Badge variant="secondary" className="ml-1">On-Chain</Badge>
                </Label>
                <Input
                  id="symbol"
                  type="text"
                  placeholder="AWESOME"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="text-sm sm:text-base"
                />
                <div className="text-xs text-muted-foreground">
                  Short symbol for your collection (e.g., AWESOME)
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="site_description" className="text-sm sm:text-base font-medium">
                  Public Description <Badge variant="outline" className="ml-1">Off-Chain</Badge>
                </Label>
                <Textarea
                  id="site_description"
                  placeholder="Explain your collection for collectors…"
                  value={formData.site_description}
                  onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                  maxLength={2000}
                  className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                />
                <div className="text-xs text-muted-foreground">
                  This appears on your public collection page in this app. Good for long details, roadmap, utilities, links. ({formData.site_description.length}/2000)
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="onchain_description" className="text-sm sm:text-base font-medium">
                  Short Description <Badge variant="secondary" className="ml-1">On-Chain</Badge>
                </Label>
                <Textarea
                  id="onchain_description"
                  placeholder="Short description for on-chain metadata"
                  value={formData.onchain_description}
                  onChange={(e) => setFormData({ ...formData, onchain_description: e.target.value })}
                  maxLength={200}
                  className="min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
                />
                <div className="text-xs text-muted-foreground">
                  Stored on-chain and shown in wallets/marketplaces. Keep it brief. ({formData.onchain_description.length}/200)
                </div>
              </div>

              {/* Supply Mode Selection */}
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base font-medium">Supply Mode</Label>
                <Select 
                  value={formData.supply_mode} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    supply_mode: value,
                    max_supply: value === 'open' ? 0 : formData.max_supply
                  })}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium text-sm">Fixed Supply</div>
                          <div className="text-xs text-muted-foreground">Set a specific number of NFTs</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="open">
                      <div className="flex items-center gap-2">
                        <Infinity className="h-4 w-4" />
                        <div>
                          <div className="font-medium text-sm">Open Edition ∞</div>
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
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="max_supply" className="text-sm sm:text-base font-medium">
                    Max Supply <Badge variant="secondary" className="ml-1">On-Chain</Badge>
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
                    className="text-sm sm:text-base"
                  />
                  <div className="text-xs text-muted-foreground">
                    Total number of NFTs that can be minted (1-100,000)
                  </div>
                </div>
              )}

              {/* Optional Mint End Date */}
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="mint_end_at" className="text-sm sm:text-base font-medium">
                  Mint End Date & Time (Optional) <Badge variant="outline" className="ml-1">Off-Chain</Badge>
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:flex-1 justify-start text-left font-normal text-sm sm:text-base",
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
                  
                   <div className="flex items-center gap-2 justify-center sm:justify-start">
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
                       <SelectTrigger className="w-16 sm:w-20 text-sm">
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
                       <SelectTrigger className="w-16 sm:w-20 text-sm">
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
                     
                     <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
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

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="category" className="text-sm sm:text-base font-medium">
                  Category <Badge variant="outline" className="ml-1">Off-Chain</Badge>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="text-sm sm:text-base">
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
              <div className="space-y-4 sm:space-y-6 pt-4 border-t">
                <div className="flex items-start space-x-3">
                  <Switch
                    id="explicit_content"
                    checked={formData.explicit_content}
                    onCheckedChange={(checked) => setFormData({ ...formData, explicit_content: checked })}
                    className="mt-0.5"
                  />
                  <Label htmlFor="explicit_content" className="text-sm sm:text-base font-medium leading-tight">
                    Contains explicit or sensitive content
                  </Label>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Switch
                      id="enable_primary_sales"
                      checked={formData.enable_primary_sales}
                      onCheckedChange={(checked) => setFormData({ ...formData, enable_primary_sales: checked })}
                      className="mt-0.5"
                    />
                    <Label htmlFor="enable_primary_sales" className="text-sm sm:text-base font-medium leading-tight">
                      List for sale immediately after minting
                    </Label>
                  </div>

                  {formData.enable_primary_sales && (
                    <div className="ml-6 space-y-2 sm:space-y-3">
                      <Label htmlFor="mint_price_input" className="text-sm sm:text-base font-medium">
                        Price (SOL) <span className="text-destructive">*</span> <Badge variant="secondary" className="ml-1">On-Chain</Badge>
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
                        className="text-sm sm:text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Set the initial listing price for NFTs from this collection
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Properties Section */}
              <div className="pt-4 border-t">
                <PropertiesEditor
                  properties={formData.attributes}
                  onChange={(properties) => setFormData({ ...formData, attributes: properties })}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
                <Button variant="outline" onClick={() => setActiveStep(0)} className="w-full sm:w-auto">
                  Back
                </Button>
                <Button onClick={() => setActiveStep(2)} disabled={!formData.name.trim()} className="w-full sm:w-auto">
                  Next: Upload Images
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
      )}

      {activeStep === 2 && (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                Collection Settings
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configure advanced settings for your collection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base font-medium">
                  Collection Avatar <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground">(Required)</span> <Badge variant="secondary" className="ml-1">On-Chain</Badge>
                </Label>
                <FileUpload
                  onFileSelect={(file) => {
                    if (formData.image_preview_url) {
                      URL.revokeObjectURL(formData.image_preview_url);
                    }
                    const previewUrl = file ? URL.createObjectURL(file) : null;
                    setFormData({ ...formData, image_file: file, image_preview_url: previewUrl });
                  }}
                  currentFile={formData.image_file}
                  previewUrl={formData.image_preview_url}
                  placeholder="Click to upload collection logo"
                  aspectRatio={1}
                  maxSizeText="JPG, PNG, GIF, WEBP • Max 10MB"
                />
                <div className="text-xs text-muted-foreground">
                  Upload a logo for your collection
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base font-medium">
                  Collection Banner <span className="text-xs text-muted-foreground">(Optional)</span> <Badge variant="outline" className="ml-1">Off-Chain</Badge>
                </Label>
                <FileUpload
                  onFileSelect={(file) => {
                    if (formData.banner_preview_url) {
                      URL.revokeObjectURL(formData.banner_preview_url);
                    }
                    const previewUrl = file ? URL.createObjectURL(file) : null;
                    setFormData({ ...formData, banner_file: file, banner_preview_url: previewUrl });
                  }}
                  currentFile={formData.banner_file}
                  previewUrl={formData.banner_preview_url}
                  placeholder="Click to upload banner image"
                  aspectRatio={3}
                  maxSizeText="JPG, PNG, GIF, WEBP • Max 10MB"
                />
                <div className="text-xs text-muted-foreground">
                  Upload a banner image for your collection
                </div>
              </div>

                {/* Mint price configured in Step 1 to avoid duplication */}

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base font-medium">
                  Royalties (%) <Badge variant="secondary" className="ml-1">On-Chain</Badge>
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
                      className="w-20 text-center text-sm sm:text-base"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Percentage of royalties on secondary sales (0-50%)
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="treasury_wallet" className="text-sm sm:text-base font-medium">
                  Treasury Wallet <Badge variant="secondary" className="ml-1">On-Chain</Badge>
                </Label>
                <Input
                  id="treasury_wallet"
                  type="text"
                  placeholder={publicKey || "Connect wallet"}
                  value={formData.treasury_wallet || publicKey || ''}
                  onChange={(e) => setFormData({ ...formData, treasury_wallet: e.target.value })}
                  disabled={!!publicKey}
                  className="text-xs sm:text-sm font-mono"
                />
                <div className="text-xs text-muted-foreground">
                  Wallet address to receive royalties
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Switch
                  id="whitelist_enabled"
                  checked={formData.whitelist_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, whitelist_enabled: checked })}
                  className="mt-0.5"
                />
                <Label htmlFor="whitelist_enabled" className="text-sm sm:text-base font-medium leading-tight">
                  Whitelist Enabled
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
                <Button variant="outline" onClick={() => setActiveStep(1)} className="w-full sm:w-auto">
                  Back
                </Button>
                <Button onClick={() => setActiveStep(3)} disabled={!formData.image_file} className="w-full sm:w-auto">
                  Next: Review
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
      )}

      {activeStep === 3 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                Review Collection Details
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Please review the details of your collection before submitting.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {/* Collection Header */}
              <div className="bg-muted/30 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  {/* Collection Avatar */}
                  {(formData.image_file || formData.image_preview_url) && (
                    <img 
                      src={formData.image_preview_url || (formData.image_file ? URL.createObjectURL(formData.image_file) : '')}
                      alt="Collection avatar preview"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-border mx-auto sm:mx-0"
                      onError={(e) => {
                        // Fallback if preview URL fails
                        if (formData.image_file && !e.currentTarget.src.startsWith('blob:')) {
                          e.currentTarget.src = URL.createObjectURL(formData.image_file);
                        }
                      }}
                    />
                  )}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">{formData.name}</h2>
                    {formData.symbol && (
                      <Badge variant="secondary" className="mb-3">{formData.symbol}</Badge>
                    )}
                    {formData.onchain_description && (
                      <p className="text-sm sm:text-base text-muted-foreground mb-3">{formData.onchain_description}</p>
                    )}
                   </div>
                 </div>
               </div>

               {/* Collection Info */}
               <div className="flex-1">
                 <div className="flex items-start justify-between">
                   <div>
                     <h2 className="text-2xl font-bold">{formData.name}</h2>
                     <p className="text-lg text-muted-foreground">{formData.symbol}</p>
                     <p className="text-sm text-muted-foreground mt-1">{formData.category}</p>
                   </div>
                   
                   {/* Content Rating Badge */}
                      <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full">
                        <div className={`w-2 h-2 rounded-full ${formData.explicit_content ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                        <span className="text-xs font-medium">
                          {formData.explicit_content ? 'Explicit' : 'Safe'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Collection Banner */}
                {(formData.banner_file || formData.banner_preview_url) && (
                  <div className="mt-4">
                    <img 
                      src={formData.banner_preview_url || (formData.banner_file ? URL.createObjectURL(formData.banner_file) : '')} 
                      alt="Collection banner preview"
                      className="w-full h-32 rounded-lg object-cover"
                      onError={(e) => {
                        // Fallback if preview URL fails
                        if (formData.banner_file && !e.currentTarget.src.startsWith('blob:')) {
                          e.currentTarget.src = URL.createObjectURL(formData.banner_file);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column - Descriptions */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <Label className="text-base font-medium">Public Description</Label>
                    <div className="text-sm text-muted-foreground leading-relaxed mt-2 p-4 bg-muted/30 rounded-lg">
                      {formData.site_description || "No public description provided"}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium">On-Chain Description</Label>
                    <div className="text-sm text-muted-foreground leading-relaxed mt-2 p-4 bg-muted/30 rounded-lg">
                      {formData.onchain_description || "No on-chain description provided"}
                    </div>
                  </div>
                  
                  {/* Properties Section */}
                  <div>
                    <Label className="text-base font-medium">Properties</Label>
                    {formData.attributes.length > 0 ? (
                      <div className="grid gap-2 mt-2">
                        {formData.attributes.map((attr, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-sm">
                            <span className="font-medium">{attr.trait_type}</span>
                            <div className="text-right">
                              <div className="font-semibold">{attr.display_type === 'date' && attr.value ? format(parse(attr.value, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : attr.value}</div>
                              <div className="text-muted-foreground text-xs">
                                {attr.display_type === 'text' ? 'Text' : 
                                 attr.display_type === 'number' ? 'Number' :
                                 attr.display_type === 'boost_percentage' ? 'Bonus (%)' :
                                 attr.display_type === 'boost_number' ? 'Bonus (number)' :
                                 attr.display_type === 'date' ? 'Date' : 'Text'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg mt-2">
                        No properties added
                      </div>
                    )}
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
                
                {/* Right Column - Settings */}
                <div className="space-y-6">
                  {/* Pricing & Supply */}
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <Label className="text-base font-medium">Pricing & Supply</Label>
                    <div className="grid gap-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Mint Price</span>
                        <span className="font-bold text-lg">{formData.mint_price} SOL</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Supply</span>
                        <span className="font-semibold">
                          {formData.supply_mode === 'open' ? '∞ Open' : `${formData.max_supply} Max`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Royalties</span>
                        <span className="font-semibold">{formData.royalty_percentage.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Settings */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <Label className="text-base font-medium">Settings</Label>
                    <div className="space-y-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Whitelist</span>
                        <Badge variant={formData.whitelist_enabled ? 'default' : 'secondary'}>
                          {formData.whitelist_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Primary Sales</span>
                        <Badge variant={formData.enable_primary_sales ? 'default' : 'secondary'}>
                          {formData.enable_primary_sales ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Treasury Wallet */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <Label className="text-base font-medium">Treasury Wallet</Label>
                    <div className="text-xs font-mono bg-background p-3 rounded border mt-2 break-all">
                      {formData.treasury_wallet || publicKey}
                    </div>
                  </div>
                </div>
              </div>
               <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 sm:pt-8 border-t mt-6 sm:mt-8">
                 <Button variant="outline" onClick={() => setActiveStep(2)} className="w-full sm:w-auto">
                   Back
                 </Button>
                  <Button 
                    onClick={handleSubmit} 
                    size="lg"
                    disabled={!!formData.mint_end_at_error || isMinting || !formData.image_file}
                    className="w-full sm:w-auto"
                  >
                   {isMinting ? 'Creating & Minting...' : 'Create Collection + Mint NFT'}
                   <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
               </div>
             </CardContent>
           </Card>
       )}

       {activeStep === 4 && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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
                         <div className="flex items-center justify-between mb-2">
                           <div className="text-sm text-muted-foreground">Collection Mint Address</div>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleCopyAddress(step3Collection.collection_mint_address)}
                             className="h-6 px-2"
                           >
                             <Copy className="h-3 w-3" />
                           </Button>
                         </div>
                         <div className="font-mono text-xs break-all bg-background p-2 rounded border">
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
                     <Button variant="outline" onClick={handleCreateAnother} className="w-full">
                       Create Another Collection
                     </Button>
                     <Button variant="secondary" onClick={handleGoToProfile} className="w-full">
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
