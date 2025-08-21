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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  Edit2,
  Lock
} from 'lucide-react';
import { SolanaWalletButton } from '@/components/SolanaWalletButton';
import { useCollections, type CreateCollectionData } from '@/hooks/useCollections';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useToast } from '@/hooks/use-toast';
import { MintingInterface } from '@/components/MintingInterface';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { validateImageFile, validateCollectionData, areRequiredFieldsValid, validateStandaloneNFTData } from '@/utils/validation';
import { useStandaloneMint, type StandaloneNFTData } from '@/hooks/useStandaloneMint';
import { supabase } from '@/integrations/supabase/client';
export const UnifiedMintInterface = () => {
  const { connected, publicKey } = useSolanaWallet();
  const { creating, createCollection } = useCollections();
  const { minting, mintStandaloneNFT } = useStandaloneMint();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'collection' | 'standalone'>('collection');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [createdCollectionId, setCreatedCollectionId] = useState<string | null>(null);
  const [isCollectionSetupComplete, setIsCollectionSetupComplete] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState<CreateCollectionData>({
    name: '',
    symbol: undefined,
    site_description: '',
    onchain_description: '',
    external_links: [],
    category: '',
    explicit_content: false,
    enable_primary_sales: false, // Disabled in simple folder step
    mint_price: undefined,
    max_supply: undefined,
    royalty_percentage: undefined,
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

  // Update the success handler to move to step 2
  React.useEffect(() => {
    if (createdCollectionId) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}, [createdCollectionId]);

  // Scroll to top when entering Step 3
  React.useEffect(() => {
    if (currentStep === 3) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Load collection details for Step 3 banner
  type Step3Collection = {
    id: string;
    name: string;
    symbol?: string | null;
    image_url?: string | null;
    banner_image_url?: string | null;
    mint_price: number;
    max_supply: number;
    items_redeemed?: number | null;
    royalty_percentage?: number | null;
    is_live: boolean;
    whitelist_enabled?: boolean | null;
    treasury_wallet?: string | null;
    description?: string | null;
  };
  const [step3Collection, setStep3Collection] = useState<Step3Collection | null>(null);

  const loadStep3Collection = React.useCallback(async () => {
    if (!createdCollectionId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_collection_details', { collection_id: createdCollectionId });
      
      console.log('Step 3 DB data:', data?.[0]);
      console.log('Step 3 formData:', formData);
      console.log('Step 3 imagePreview:', imagePreview);
      console.log('Step 3 bannerPreview:', bannerPreview);
      
      if (!error && data && data.length > 0) {
        setStep3Collection(data[0] as Step3Collection);
      } else {
        // Fallback to form data when database call fails
        setStep3Collection({
          id: createdCollectionId,
          name: formData.name || 'Untitled Collection',
          symbol: formData.symbol || null,
          image_url: imagePreview || null,
          banner_image_url: bannerPreview || null,
          mint_price: parseFloat(formData.mint_price?.toString() || '0') || 0,
          max_supply: parseInt(formData.max_supply?.toString() || '0') || 0,
          items_redeemed: 0,
          royalty_percentage: parseFloat(formData.royalty_percentage?.toString() || '0') || 0,
          is_live: true,
          whitelist_enabled: formData.whitelist_enabled ?? null,
          treasury_wallet: formData.treasury_wallet || publicKey || null,
          description: formData.site_description || null,
        });
      }
    } catch (error) {
      // Use form data as fallback
      setStep3Collection({
        id: createdCollectionId,
        name: formData.name || 'Untitled Collection',
        symbol: formData.symbol || null,
        image_url: imagePreview || null,
        banner_image_url: bannerPreview || null,
        mint_price: parseFloat(formData.mint_price?.toString() || '0') || 0,
        max_supply: parseInt(formData.max_supply?.toString() || '0') || 0,
        items_redeemed: 0,
        royalty_percentage: parseFloat(formData.royalty_percentage?.toString() || '0') || 0,
        is_live: true
      });
    }
  }, [createdCollectionId, formData, imagePreview, bannerPreview]);

  React.useEffect(() => {
    if (createdCollectionId && currentStep === 3) {
      loadStep3Collection();
    }
  }, [createdCollectionId, currentStep, loadStep3Collection]);

  // Step Indicator Component
  const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep || 
            (stepNumber === 1 && createdCollectionId) ||
            (stepNumber === 2 && isCollectionSetupComplete);
          
          const stepNames = ['Create Collection', 'Configure Minting', 'Mint NFTs'];
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold
                ${isActive 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : isCompleted 
                    ? 'bg-primary/20 text-primary border-primary' 
                    : 'bg-muted text-muted-foreground border-muted-foreground/30'
                }
              `}>
                {isCompleted && stepNumber !== currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="ml-2 text-sm">
                <div className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Step {stepNumber}
                </div>
                <div className={`text-xs ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                  {stepNames[i]}
                </div>
              </div>
              {stepNumber < totalSteps && (
                <ChevronRight className={`w-5 h-5 mx-4 ${
                  stepNumber < currentStep || (stepNumber === 1 && createdCollectionId) || (stepNumber === 2 && isCollectionSetupComplete)
                    ? 'text-primary' 
                    : 'text-muted-foreground/50'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

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
    setCurrentStep(1);
    setIsCollectionSetupComplete(false);
    setFormData({
      name: '',
      symbol: undefined,
      site_description: '',
      onchain_description: '',
      external_links: [],
      category: '',
      explicit_content: false,
      enable_primary_sales: false,
      mint_price: undefined,
      max_supply: undefined,
      royalty_percentage: undefined,
      treasury_wallet: publicKey || '',
      whitelist_enabled: false,
    });
    setImageFile(null);
    setImagePreview(null);
    setBannerFile(null);
    setBannerPreview(null);
    setShowAdvanced(false);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !createdCollectionId) {
      // Must create collection first
      toast({
        title: 'Create Collection First',
        description: 'Please create your collection before proceeding to Step 2.',
        variant: 'destructive',
      });
      return;
    }
    if (currentStep === 2 && !isCollectionSetupComplete) {
      toast({
        title: 'Complete Setup First',
        description: 'Please complete the collection setup before proceeding to minting.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3) as 1 | 2 | 3);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1) as 1 | 2 | 3);
  };

  const handleCompleteSetup = async () => {
    // For existing collections, we don't need to re-validate image files
    const isExistingCollection = !!createdCollectionId;
    
    // Validate required fields - relaxed for existing collections
    if (!formData.symbol || (!imageFile && !isExistingCollection && !imagePreview)) {
      toast({
        title: 'Missing required fields',
        description: isExistingCollection 
          ? 'Please add Symbol to update collection settings'
          : 'Please add Symbol and Avatar before completing setup',
        variant: 'destructive',
      });
      return;
    }

    // Validate royalty percentage
    if (formData.royalty_percentage && (formData.royalty_percentage < 0 || formData.royalty_percentage > 50)) {
      toast({
        title: 'Invalid royalty percentage',
        description: 'Royalty must be between 0% and 50%',
        variant: 'destructive',
      });
      return;
    }
    
    if (isExistingCollection) {
      // Update existing collection using update-collection edge function
      try {
        const { data, error } = await supabase.functions.invoke('update-collection', {
          body: {
            collection_id: createdCollectionId,
            updates: {
              mint_price: formData.mint_price || 0,
              treasury_wallet: formData.treasury_wallet || publicKey || '',
              whitelist_enabled: formData.whitelist_enabled || false,
              onchain_description: formData.onchain_description || null,
            }
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success) {
          setIsCollectionSetupComplete(true);
          setCurrentStep(3);
          
          // Force reload of Step 3 collection data
          await loadStep3Collection();
          
          toast({
            title: '✅ Collection Updated!',
            description: 'Your collection settings have been updated successfully.',
          });
        } else {
          throw new Error(data?.error || 'Failed to update collection');
        }
      } catch (error) {
        toast({
          title: 'Update Failed',
          description: error instanceof Error ? error.message : 'Failed to update collection settings',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Create new collection using original method
      const result = await createCollection({
        ...formData,
        symbol: formData.symbol,
        enable_primary_sales: true,
        image_file: imageFile || undefined, // Only include if we have a new file
        mint_price: formData.mint_price || 0,
        max_supply: formData.max_supply || 1000,
        royalty_percentage: Math.min(Math.max(formData.royalty_percentage || 5, 0), 50), // Ensure it's within bounds
        treasury_wallet: formData.treasury_wallet || publicKey || '',
      });
      
      if (result?.success) {
        setIsCollectionSetupComplete(true);
        setCurrentStep(3);
        
        toast({
          title: '🎉 Collection Setup Complete!',
          description: 'You can now start minting NFTs from your collection.',
        });
        
        // Clear the file objects since they're uploaded to storage
        setImageFile(null);
        setBannerFile(null);
      } else {
        const errorMessage = (result as any)?.error || 'Failed to complete collection setup';
        toast({
          title: 'Setup Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }
    }
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

  // If collection is created and on Step 3, show minting interface directly
  if (createdCollectionId && currentStep === 3) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Congratulations Banner */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                🎉 Collection Setup Complete!
              </CardTitle>
              <p className="text-muted-foreground">
                Your collection "<strong>{formData.name}</strong>" is now live and ready for minting. Individual NFTs can now be created and sold.
              </p>
            </div>
            <Button variant="outline" onClick={resetCollection}>
              Create Another
            </Button>
          </CardHeader>
        </Card>

        {/* Collection Banner */}
        {(step3Collection?.banner_image_url || bannerPreview) && (
          <Card className="overflow-hidden relative">
            <AspectRatio ratio={16/5}>
              <img
                src={step3Collection?.banner_image_url || bannerPreview!}
                alt={`${formData.name || step3Collection?.name} banner`}
                className="w-full h-full object-cover"
              />
                 {/* Collection Avatar Overlay - Doubled Size */}
                 {(imagePreview || step3Collection?.image_url) && (
                   <div className="absolute bottom-6 left-6">
                     <div className="w-64 h-64 rounded-xl overflow-hidden border-4 border-background shadow-xl">
                       <img 
                         src={imagePreview || step3Collection?.image_url!}
                         alt={`${step3Collection?.name || formData.name} avatar`}
                         className="w-full h-full object-cover"
                       />
                     </div>
                   </div>
                 )}
            </AspectRatio>
          </Card>
        )}

        {/* Step 3 Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Step 3: Create NFTs in this Collection
          </h1>
          <p className="text-muted-foreground">
            Your collection is set up and ready. Configure individual NFT details and start minting.
          </p>
        </div>

        {/* Collection Details Header */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
          <CardHeader>
            <div className="space-y-6">
              {/* Collection Name & Symbol */}
              <div className="space-y-3">
                <h2 className="text-2xl font-bold">Collection Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Collection Name</label>
                    <p className="text-xl font-bold mt-1">{step3Collection?.name || formData.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Collection Symbol</label>
                    <p className="text-xl font-bold mt-1">{step3Collection?.symbol || formData.symbol || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Collection Configuration - Locked & Editable Fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Mint Price - Editable */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="text-center p-4 bg-background/50 rounded-lg border-2 border-green-200 dark:border-green-800 hover:bg-background/70 cursor-pointer">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Edit2 className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600 font-medium">EDITABLE</span>
                            </div>
                            <div className="font-bold text-lg text-green-600">
                              {((formData.mint_price ?? step3Collection?.mint_price) === 0)
                                ? 'FREE'
                                : `${formData.mint_price ?? step3Collection?.mint_price ?? ''} SOL`}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Collection Mint Price</div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Mint Price</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Label htmlFor="edit-mint-price">Mint Price (SOL)</Label>
                            <Input
                              id="edit-mint-price"
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={formData.mint_price ?? step3Collection?.mint_price ?? 0}
                              onBlur={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                setFormData(prev => ({ ...prev, mint_price: newPrice }));
                                toast({ title: "Price updated", description: `Mint price set to ${newPrice} SOL` });
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TooltipTrigger>
                    <TooltipContent>Click to edit mint price</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Max Supply - Locked */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="text-center p-4 bg-background/50 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Lock className="h-3 w-3 text-orange-600" />
                          <span className="text-xs text-orange-600 font-medium">LOCKED</span>
                        </div>
                        <div className="font-bold text-lg">{(formData.max_supply ?? step3Collection?.max_supply)?.toLocaleString?.()}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Collection Max Supply</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Cannot be changed after creation</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Royalties - Locked */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="text-center p-4 bg-background/50 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Lock className="h-3 w-3 text-orange-600" />
                          <span className="text-xs text-orange-600 font-medium">LOCKED</span>
                        </div>
                        <div className="font-bold text-lg">{(formData.royalty_percentage ?? step3Collection?.royalty_percentage ?? 0)}%</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Collection Royalties</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Cannot be changed after creation</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Status - Show current */}
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="font-bold text-lg text-primary">{(step3Collection?.is_live ?? true) ? 'LIVE' : 'PAUSED'}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Collection Status</div>
                </div>
              </div>

              {/* Collection Advanced Settings - Editable */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Treasury Wallet - Editable */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="p-4 bg-background/50 rounded-lg border-2 border-green-200 dark:border-green-800 hover:bg-background/70 cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Collection Treasury Wallet</div>
                              <div className="flex items-center gap-1">
                                <Edit2 className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">EDITABLE</span>
                              </div>
                            </div>
                            <div className="font-mono break-all text-sm">
                              {formData.treasury_wallet || publicKey || step3Collection?.treasury_wallet || '—'}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Treasury Wallet</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Label htmlFor="edit-treasury">Treasury Wallet Address</Label>
                            <Input
                              id="edit-treasury"
                              defaultValue={formData.treasury_wallet || publicKey || step3Collection?.treasury_wallet || ''}
                              onBlur={(e) => {
                                const newWallet = e.target.value.trim();
                                setFormData(prev => ({ ...prev, treasury_wallet: newWallet }));
                                toast({ title: "Treasury updated", description: "Treasury wallet address updated" });
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TooltipTrigger>
                    <TooltipContent>Click to edit treasury wallet</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Whitelist - Editable */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="p-4 bg-background/50 rounded-lg border-2 border-green-200 dark:border-green-800 hover:bg-background/70 cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Collection Whitelist</div>
                              <div className="flex items-center gap-1">
                                <Edit2 className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">EDITABLE</span>
                              </div>
                            </div>
                            <div className="text-sm font-semibold">
                              {(formData.whitelist_enabled ?? step3Collection?.whitelist_enabled) ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Whitelist Setting</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Label htmlFor="edit-whitelist">Enable Whitelist</Label>
                            <Switch
                              id="edit-whitelist"
                              defaultChecked={formData.whitelist_enabled ?? step3Collection?.whitelist_enabled ?? false}
                              onCheckedChange={(checked) => {
                                setFormData(prev => ({ ...prev, whitelist_enabled: checked }));
                                toast({ title: "Whitelist updated", description: `Whitelist ${checked ? 'enabled' : 'disabled'}` });
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TooltipTrigger>
                    <TooltipContent>Click to edit whitelist setting</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* On-chain Description - Editable */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="p-4 bg-background/50 rounded-lg border-2 border-green-200 dark:border-green-800 hover:bg-background/70 cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Collection On-chain Description</div>
                              <div className="flex items-center gap-1">
                                <Edit2 className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">EDITABLE</span>
                              </div>
                            </div>
                            <div className="text-sm line-clamp-2">
                              {formData.onchain_description || step3Collection?.description || '—'}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit On-chain Description</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Label htmlFor="edit-description">On-chain Description</Label>
                            <Textarea
                              id="edit-description"
                              defaultValue={formData.onchain_description || step3Collection?.description || ''}
                              maxLength={200}
                              onBlur={(e) => {
                                const newDescription = e.target.value.trim();
                                setFormData(prev => ({ ...prev, onchain_description: newDescription }));
                                toast({ title: "Description updated", description: "On-chain description updated" });
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TooltipTrigger>
                    <TooltipContent>Click to edit on-chain description</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Per-NFT Details (Optional) */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/20">
                <CardTitle className="text-xl font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-5 w-5" />
                    Individual NFT Artwork & Details (Optional)
                  </div>
                  <ChevronDown className="h-5 w-5" />
                </CardTitle>
                <p className="text-muted-foreground text-left">
                  Configure specific details for each NFT in your mint batch (image, name, description, attributes).
                </p>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NFT Image */}
                  <div className="space-y-4">
                    <Label htmlFor="nft-image">Individual NFT Image (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                      <AspectRatio ratio={1}>
                        <div className="flex h-full w-full items-center justify-center text-center bg-muted/20">
                          <div>
                            <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Upload NFT Artwork</p>
                            <p className="text-xs text-muted-foreground">Will be used for all NFTs in this mint</p>
                          </div>
                        </div>
                      </AspectRatio>
                    </div>
                  </div>
                  
                  {/* NFT Details */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nft-name">NFT Name (Optional)</Label>
                      <Input
                        id="nft-name"
                        placeholder="e.g., Cyber Samurai #1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="nft-description">NFT Description (Optional)</Label>
                      <Textarea
                        id="nft-description"
                        placeholder="Description for individual NFTs..."
                        className="h-20"
                      />
                    </div>
                  </div>
                </div>
                
                {/* NFT Attributes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">NFT Attributes (Optional)</Label>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Attribute
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Add metadata attributes that will be applied to all NFTs in this mint batch.
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Minting Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Create NFTs in this Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {createdCollectionId && (
              <MintingInterface collectionId={createdCollectionId} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If collection is created, show setup/minting interface (Step 2)
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
                Your Master Blueprint is ready. Now, let's set the permanent, on-chain rules for the individual NFTs that will be minted into this collection.
              </p>
            </div>
            <Button variant="outline" onClick={resetCollection}>
              Create Another
            </Button>
          </CardHeader>
        </Card>

        {/* Collection Banner - Show if uploaded */}
        {bannerPreview && (
          <Card className="overflow-hidden">
            <AspectRatio ratio={16/5}>
              <img
                src={bannerPreview}
                alt={`${formData.name} banner`}
                className="w-full h-full object-cover"
              />
            </AspectRatio>
          </Card>
        )}

        {/* Collection Details from Step 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Collection Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Collection Name</label>
                <p className="text-sm font-semibold">{formData.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-sm">{formData.category || 'Not set'}</p>
              </div>
            </div>
            {formData.site_description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{formData.site_description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Collection Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Step 2: Set the Rules for Your NFTs
              <Badge variant="secondary">Required for minting</Badge>
            </CardTitle>
            <p className="text-muted-foreground">
              Complete these settings to enable NFT minting for your collection.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form className="space-y-6">
              
              {/* Collection Avatar (Required for minting) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-semibold">Collection Avatar <span className="text-destructive">*</span></Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <p className="text-sm font-medium">Avatar Required</p>
                                <p className="text-xs text-muted-foreground">Square format (1:1 ratio)</p>
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
                    <h4 className="font-semibold">Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>Format:</strong> Square (1:1 ratio)</li>
                      <li>• <strong>Files:</strong> JPG, PNG, GIF, WEBP</li>
                      <li>• <strong>Size:</strong> Maximum 5MB</li>
                      <li>• <strong>Required:</strong> Needed for minting</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Minting Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-semibold">Minting Configuration</Label>
                </div>
                
                <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
                  <strong>Important:</strong> The settings below apply to the individual NFTs you will create (the "stamps"), not the Collection itself (the "stamp album"). You are setting the permanent rules that each NFT in this set will follow.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="symbol">
                      Symbol <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="symbol"
                      value={formData.symbol || ''}
                      onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                      placeholder="e.g., ANIMF"
                      maxLength={10}
                      className="h-12 text-lg"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">A short, unique 'ticker' for your NFT series (5-10 characters, e.g., ANIMF). This is permanent and cannot be changed after setup.</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="mint-price">Mint Price (SOL) <span className="text-destructive">*</span></Label>
                    <Input
                      id="mint-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.mint_price !== undefined ? formData.mint_price : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFormData({...formData, mint_price: undefined});
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setFormData({...formData, mint_price: numValue});
                          }
                        }
                      }}
                      placeholder="0 for free minting"
                      className="h-12 text-lg"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Set to 0 for a FREE mint, or any amount in SOL. This price is for the initial, primary sale only. After an NFT is owned, the holder can list it for any new price on the secondary market.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-supply">
                      Max Supply <span className="text-destructive">*</span>
                    </Label>
                      <Input
                        id="max-supply"
                        type="number"
                        min="1"
                        max="100000"
                        value={formData.max_supply !== undefined ? formData.max_supply : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') {
                            setFormData({ ...formData, max_supply: undefined });
                          } else {
                            const num = parseInt(v, 10);
                            if (!isNaN(num)) {
                              setFormData({ ...formData, max_supply: num });
                            }
                          }
                        }}
                        className="h-12 text-lg"
                        required
                      />
                    <p className="text-xs text-muted-foreground mt-1">The total number of identical NFTs that can ever be created in this collection. Value must be between 1 and 100,000. This is permanent and cannot be changed after setup.</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="royalties">Royalties (%) <span className="text-destructive">*</span></Label>
                    <Input
                      id="royalties"
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                        value={formData.royalty_percentage !== undefined ? formData.royalty_percentage : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') {
                            setFormData({ ...formData, royalty_percentage: undefined });
                          } else {
                            const num = parseFloat(v);
                            if (!isNaN(num) && num >= 0 && num <= 50) {
                              setFormData({ ...formData, royalty_percentage: num });
                            }
                          }
                        }}
                      className="h-12 text-lg"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Set the permanent royalty percentage for all NFTs in this collection. This rule is set once and cannot be changed later. Value can be from 0% to 50%.</p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="treasury">
                    Treasury Wallet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="treasury"
                    value={formData.treasury_wallet || publicKey || ''}
                    onChange={(e) => setFormData({...formData, treasury_wallet: e.target.value})}
                    placeholder="Wallet address for payments"
                    className="h-12 text-lg"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">The Solana wallet address that will receive your initial sales and future royalties</p>
                </div>
              </div>

              {/* Optional Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-semibold">Optional Settings</Label>
                </div>
                
                <div>
                  <Label htmlFor="onchain-description">On-Chain Description (Optional)</Label>
                  <Textarea
                    id="onchain-description"
                    value={formData.onchain_description || ''}
                    onChange={(e) => setFormData({...formData, onchain_description: e.target.value})}
                    placeholder="Brief description stored on blockchain..."
                    className="h-20 text-lg"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(formData.onchain_description || '').length}/200 characters - Stored permanently on-chain
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="whitelist" className="font-medium">Enable Whitelist</Label>
                    <p className="text-sm text-muted-foreground">Only allow specific wallet addresses to mint (exclusive access)</p>
                  </div>
                  <Switch 
                    id="whitelist"
                    checked={formData.whitelist_enabled || false}
                    onCheckedChange={(checked) => setFormData({...formData, whitelist_enabled: checked})}
                  />
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleCompleteSetup}
                disabled={creating}
                className="w-full h-12 text-lg font-semibold"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting up Collection...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-5 w-5" />
                    Mint Collection and Continue to Step 3
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
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
            A Collection is the official **Master Blueprint** for your art series. It groups all of your individual NFTs together, proves their authenticity to buyers, and allows you to set on-chain rules like a maximum supply. For any serious project, creating a Collection is the most important first step.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant={activeTab === 'collection' ? 'default' : 'outline'}
              onClick={() => setActiveTab('collection')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Collection & Mint
              <Badge variant="secondary" className="ml-2">Recommended</Badge>
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
        <TabsContent value="collection">
          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} totalSteps={3} />
          
          {currentStep === 1 ? (
            /* Step 1: Collection Creation */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Plus className="h-6 w-6" />
                  Step 1: Create Your Collection
                  <Badge variant="secondary" className="ml-2">Recommended</Badge>
                </CardTitle>
                <p className="text-muted-foreground">
                  Start here by creating a professional collection for your art series. You will only set up the basic details now; you can add the on-chain rules like max supply and royalties in the next step.
                </p>
              </CardHeader>
              
              <CardContent className="space-y-8">
                <form onSubmit={handleCreateCollection} className="space-y-8">
                  
                  {/* Collection Information - First */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      <Label className="text-lg font-semibold">Collection Information</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="name">
                        Collection Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Cyber Samurai Chronicles"
                        minLength={3}
                        maxLength={32}
                        className="h-12 text-lg"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formData.name || '').length}/32 characters (min: 3)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="site-description">Description (Optional)</Label>
                      <Textarea
                        id="site-description"
                        value={formData.site_description}
                        onChange={(e) => setFormData({...formData, site_description: e.target.value})}
                        placeholder="Tell the story behind your art series..."
                        className="h-28 text-lg"
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formData.site_description || '').length}/2000 characters - Can be changed later
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="category">Category (Optional)</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai-art">AI Art</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                          <SelectItem value="art">Art</SelectItem>
                          <SelectItem value="collectibles">Collectibles</SelectItem>
                          <SelectItem value="domains">Domain Names</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="meme">Meme</SelectItem>
                          <SelectItem value="metaverse">Metaverse</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="pfp">Profile Pictures (PFP)</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="trading-cards">Trading Cards</SelectItem>
                          <SelectItem value="utility">Utility</SelectItem>
                          <SelectItem value="virtual-worlds">Virtual Worlds</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Can be changed later</p>
                    </div>
                  </div>

                  {/* Banner - Last */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <Label className="text-lg font-semibold">Banner (Optional)</Label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="banner-upload" className="cursor-pointer">
                          <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                            <AspectRatio ratio={3 / 1}>
                              {bannerPreview ? (
                                <img
                                  src={bannerPreview}
                                  alt="Collection banner"
                                  className="h-full w-full object-cover rounded-md"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-center bg-muted/20">
                                  <div>
                                    <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">Banner (Optional)</p>
                                    <p className="text-xs text-muted-foreground">Wide format 3:1</p>
                                  </div>
                                </div>
                              )}
                            </AspectRatio>
                          </div>
                        </Label>
                        <Input
                          id="banner-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="hidden"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold">Guidelines:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Wide format (3:1 ratio) recommended</li> 
                          <li>• File formats: JPG, PNG, GIF, WEBP</li>
                          <li>• Maximum file size: 5MB</li>
                          <li>• Can be changed later when ready to mint</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6 border-t">
                    <div>
                      {/* Empty space for alignment */}
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        disabled={creating || !formData.name.trim()}
                        className="flex items-center gap-2"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            Create & Continue to Step 2
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* Step 2: Configure Minting */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Step 2: Configure NFT Minting Settings
                  <Badge variant="secondary">Required for minting</Badge>
                </CardTitle>
                <p className="text-muted-foreground">
                  {createdCollectionId ? 
                    'Your collection is ready! Now configure the minting settings for your NFTs.' :
                    'Complete these settings to enable NFT minting for your collection.'
                  }
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form className="space-y-6">
                  
                  {/* Collection Avatar (Required for minting) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <Label className="text-lg font-semibold">Collection Avatar <span className="text-destructive">*</span></Label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <p className="text-sm font-medium">Avatar Required</p>
                                    <p className="text-xs text-muted-foreground">Square format (1:1 ratio)</p>
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
                        <h4 className="font-semibold">Requirements:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• <strong>Format:</strong> Square (1:1 ratio)</li>
                          <li>• <strong>Files:</strong> JPG, PNG, GIF, WEBP</li>
                          <li>• <strong>Size:</strong> Maximum 5MB</li>
                          <li>• <strong>Required:</strong> Needed for minting</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Minting Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <Label className="text-lg font-semibold">Minting Configuration</Label>
                    </div>
                    
                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
                      <strong>Important:</strong> The settings below apply to the individual NFTs you will create (the "stamps"), not the Collection itself (the "stamp album"). You are setting the permanent rules that each NFT in this set will follow.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="symbol">
                          Symbol <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="symbol"
                          value={formData.symbol || ''}
                          onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                          placeholder="e.g., ANIMF"
                          maxLength={10}
                          className="h-12 text-lg"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">A short, unique 'ticker' for your NFT series (5-10 characters, e.g., ANIMF). This is permanent and cannot be changed after setup.</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="mint-price">Mint Price (SOL) <span className="text-destructive">*</span></Label>
                        <Input
                          id="mint-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.mint_price !== undefined ? formData.mint_price : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setFormData({...formData, mint_price: undefined});
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue) && numValue >= 0) {
                                setFormData({...formData, mint_price: numValue});
                              }
                            }
                          }}
                          placeholder="0 for free minting"
                          className="h-12 text-lg"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">Set to 0 for a FREE mint, or any amount in SOL. This price is for the initial, primary sale only. After an NFT is owned, the holder can list it for any new price on the secondary market.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-supply">
                          Max Supply <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="max-supply"
                          type="number"
                          min="1"
                          max="100000"
                          value={formData.max_supply !== undefined ? formData.max_supply : ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '') {
                              setFormData({ ...formData, max_supply: undefined });
                            } else {
                              const num = parseInt(v, 10);
                              if (!isNaN(num)) {
                                setFormData({ ...formData, max_supply: num });
                              }
                            }
                          }}
                          className="h-12 text-lg"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">The total number of identical NFTs that can ever be created in this collection. Value must be between 1 and 100,000. This is permanent and cannot be changed after setup.</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="royalties">Royalties (%) <span className="text-destructive">*</span></Label>
                        <Input
                          id="royalties"
                          type="number"
                          min="0"
                          max="50"
                          step="0.1"
                          value={formData.royalty_percentage !== undefined ? formData.royalty_percentage : ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '') {
                              setFormData({ ...formData, royalty_percentage: undefined });
                            } else {
                              const num = parseFloat(v);
                              if (!isNaN(num) && num >= 0 && num <= 50) {
                                setFormData({ ...formData, royalty_percentage: num });
                              }
                            }
                          }}
                          className="h-12 text-lg"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">Set the permanent royalty percentage for all NFTs in this collection. This rule is set once and cannot be changed later. Value can be from 0% to 50%.</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="treasury">
                        Treasury Wallet <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="treasury"
                        value={formData.treasury_wallet || publicKey || ''}
                        onChange={(e) => setFormData({...formData, treasury_wallet: e.target.value})}
                        placeholder="Wallet address for payments"
                        className="h-12 text-lg"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">The Solana wallet address that will receive your initial sales and future royalties</p>
                    </div>
                  </div>

                  {/* Optional Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <Label className="text-lg font-semibold">Optional Settings</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="onchain-description">On-Chain Description (Optional)</Label>
                      <Textarea
                        id="onchain-description"
                        value={formData.onchain_description || ''}
                        onChange={(e) => setFormData({...formData, onchain_description: e.target.value})}
                        placeholder="Brief description stored on blockchain..."
                        className="h-20 text-lg"
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formData.onchain_description || '').length}/200 characters - Stored permanently on-chain
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="whitelist" className="font-medium">Enable Whitelist</Label>
                        <p className="text-sm text-muted-foreground">Only allow specific wallet addresses to mint (exclusive access)</p>
                      </div>
                      <Switch 
                        id="whitelist"
                        checked={formData.whitelist_enabled || false}
                        onCheckedChange={(checked) => setFormData({...formData, whitelist_enabled: checked})}
                      />
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-6 border-t">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Step 1
                    </Button>
                    <div />
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
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
                        className="h-12 text-lg"
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
                        className="h-12 text-lg"
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
                      className="h-28 text-lg"
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
                        className="h-12 text-lg"
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
                        className="h-12 text-lg"
                      />
                    </div>

                    <div>
                      <Label htmlFor="standalone-category">Category</Label>
                      <Select value={standaloneData.category} onValueChange={(value) => setStandaloneData({...standaloneData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai-art">AI Art</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                          <SelectItem value="art">Art</SelectItem>
                          <SelectItem value="collectibles">Collectibles</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="meme">Meme</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="pfp">Profile Pictures (PFP)</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
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
                              className="h-10 text-base"
                            />
                          </div>
                          <div className="flex-1">
                            <Label>Value</Label>
                            <Input
                              value={attr.value}
                              onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                              placeholder="e.g., Blue"
                              className="h-10 text-base"
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