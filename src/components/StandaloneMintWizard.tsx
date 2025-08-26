import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Upload, FileText, CheckCircle, Image as ImageIcon, X, Circle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStandaloneMint, StandaloneNFTData } from '@/hooks/useStandaloneMint';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useCollection } from '@/hooks/useCollection';
import { useCollections } from '@/hooks/useCollections';
import { toast } from 'sonner';
import { PropertiesEditor, Property } from '@/components/PropertiesEditor';
import { MediaPreview } from '@/components/ui/media-preview';
import { CollectionInfoBanner } from '@/components/CollectionInfoBanner';

const STEPS = [
  { number: 1, title: 'Upload Artwork', icon: Upload },
  { number: 2, title: 'NFT Details', icon: FileText },
  { number: 3, title: 'Review & Mint', icon: CheckCircle }
];

interface StandaloneMintWizardProps {
  onStepChange?: (step: number) => void;
}

export const StandaloneMintWizard = ({ onStepChange }: StandaloneMintWizardProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const collectionId = searchParams.get('collection');
  const isCollectionLocked = Boolean(collectionId);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(collectionId);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fire step change callback
  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);
  const [formData, setFormData] = useState<StandaloneNFTData>({
    name: '',
    symbol: 'NFT',
    description: '',
    image_file: undefined,
    media_file: undefined,
    cover_image_file: undefined,
    quantity: 1,
    royalty_percentage: 0,
    category: 'Other', // Default to "Other"
    external_links: [],
    attributes: [],
    collection_id: collectionId || undefined,
    explicit_content: false, // Default to "Not explicit"
    list_after_mint: false,
    initial_price: undefined
  });
  const [quantityInput, setQuantityInput] = useState(String((1)));
  const [royaltyInput, setRoyaltyInput] = useState(String((0)));
  const [priceInput, setPriceInput] = useState('');

  const { minting, mintStandaloneNFT } = useStandaloneMint();
  const { publicKey } = useSolanaWallet();
  const { collections, loading: collectionsLoading } = useCollections({ autoLoad: true });
  const { collection: selectedCollection } = useCollection(selectedCollectionId || '');

  // Update formData when selectedCollectionId changes and populate from collection
  useEffect(() => {
    if (selectedCollection) {
      setFormData(prev => ({
        ...prev,
        collection_id: selectedCollectionId || undefined,
        category: prev.category || selectedCollection.category || 'Other',
        royalty_percentage: prev.royalty_percentage || selectedCollection.royalty_percentage || 0,
        initial_price: prev.initial_price || selectedCollection.mint_price || undefined
      }));
      
      // Update input fields to match
      if (!royaltyInput || royaltyInput === '0') {
        setRoyaltyInput(String(selectedCollection.royalty_percentage || 0));
      }
      if (!priceInput && selectedCollection.mint_price > 0) {
        setPriceInput(String(selectedCollection.mint_price));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        collection_id: selectedCollectionId || undefined
      }));
    }
  }, [selectedCollectionId, selectedCollection]);

  const handleCollectionChange = (value: string) => {
    // Don't allow changes if collection is locked
    if (isCollectionLocked) return;
    
    if (value === 'create-new') {
      navigate('/mint/collection');
      return;
    }
    
    setSelectedCollectionId(value === 'none' ? null : value);
    
    // Update URL params
    if (value === 'none') {
      setSearchParams({});
    } else {
      setSearchParams({ collection: value });
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.media_file && !formData.image_file) {
        toast.error('Please upload primary media first');
        return;
      }
      if (!formData.cover_image_file) {
        toast.error('Please upload a cover image');
        return;
      }
    }
    // Allow empty name for automatic numbering when collection is selected
    if (currentStep === 2 && !formData.name.trim() && !selectedCollection) {
      toast.error('Please enter an NFT name or select a collection for automatic naming');
      return;
    }
    
    setCurrentStep(prev => {
      const nextStep = Math.min(prev + 1, 4); // Allow step 4 for congratulations
      // Scroll to top when moving to next step
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      return nextStep;
    });
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleMint = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    const result = await mintStandaloneNFT(formData);
    if (result.success) {
      // Move to congratulations step
      setCurrentStep(4);
      
      // Scroll to top
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  const handleStartNew = () => {
    // Reset form and go back to step 1
    setFormData({
      name: '',
      symbol: 'NFT', 
      description: '',
      image_file: undefined,
      media_file: undefined,
      cover_image_file: undefined,
      quantity: 1,
      royalty_percentage: selectedCollection?.royalty_percentage || 0,
      category: selectedCollection?.category || 'Other',
      external_links: [],
      attributes: [],
      collection_id: selectedCollectionId || undefined,
      explicit_content: false,
      list_after_mint: false,
      initial_price: selectedCollection?.mint_price || undefined
    });
    setQuantityInput('1');
    setRoyaltyInput(String(selectedCollection?.royalty_percentage || 0));
    setPriceInput(selectedCollection?.mint_price ? String(selectedCollection.mint_price) : '');
    setCurrentStep(1);
    
    // Scroll to top
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  // Helper functions for preview URLs
  const getOnChainPreviewUrl = (): string | null => {
    if (formData.media_file && formData.media_file.type.startsWith('image/')) {
      return URL.createObjectURL(formData.media_file);
    }
    if (formData.cover_image_file) {
      return URL.createObjectURL(formData.cover_image_file);
    }
    if (selectedCollection?.image_url) {
      return selectedCollection.image_url;
    }
    return null;
  };

  const getMarketplacePreviewUrl = (): string | null => {
    if (formData.cover_image_file) {
      return URL.createObjectURL(formData.cover_image_file);
    }
    if (formData.media_file && formData.media_file.type.startsWith('image/')) {
      return URL.createObjectURL(formData.media_file);
    }
    if (selectedCollection?.image_url) {
      return selectedCollection.image_url;
    }
    return null;
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ 
        ...formData, 
        media_file: file,
        image_file: file.type.startsWith('image/') ? file : formData.image_file
      });
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, cover_image_file: file });
    }
  };

  const handleUseCollectionAvatar = () => {
    if (selectedCollection?.image_url) {
      fetch(selectedCollection.image_url)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], `${selectedCollection.name}-avatar.png`, { type: blob.type });
          setFormData({ ...formData, media_file: file, image_file: file });
          toast.success('Collection avatar loaded!');
        })
        .catch(() => toast.error('Failed to load collection avatar'));
    }
  };

  const handleUseCollectionCover = () => {
    if (selectedCollection?.image_url) {
      fetch(selectedCollection.image_url)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], `${selectedCollection.name}-cover.png`, { type: blob.type });
          setFormData({ ...formData, cover_image_file: file });
          toast.success('Collection cover loaded!');
        })
        .catch(() => toast.error('Failed to load collection cover'));
    }
  };

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto">
      {/* Collection Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Collection</Label>
            
            {isCollectionLocked && selectedCollection ? (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                {selectedCollection.image_url && (
                  <img 
                    src={selectedCollection.image_url} 
                    alt={selectedCollection.name}
                    className="w-6 h-6 rounded object-cover"
                  />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Minting into:</p>
                  <p className="font-medium">{selectedCollection.name} (Locked)</p>
                </div>
              </div>
            ) : isCollectionLocked && !selectedCollection ? (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Loading collection...</span>
              </div>
            ) : (
              <Select
                value={selectedCollectionId || 'none'}
                onValueChange={handleCollectionChange}
                disabled={isCollectionLocked}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collection or create new" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background shadow-md">
                  <SelectItem value="none">No Collection (Standalone NFT)</SelectItem>
                  <SelectItem value="create-new">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <span>+ Create a new collection</span>
                    </div>
                  </SelectItem>
                  {collections?.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      <div className="flex items-center gap-2">
                        {collection.image_url && (
                          <img 
                            src={collection.image_url} 
                            alt={collection.name}
                            className="w-4 h-4 rounded object-cover"
                          />
                        )}
                        <span>{collection.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <div className="flex flex-col sm:flex-row items-center justify-center mb-8 gap-2 sm:gap-0">
        <div className="flex items-center">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isCompleted ? 'bg-green-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step.number}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="sm:ml-4 text-center sm:text-right">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {currentStep <= 3 ? `Step ${currentStep} of ${STEPS.length}` : 'Complete!'}
          </p>
        </div>
      </div>

      {/* Collection Info Banner - Show in Steps 1, 2, and 3 */}
      {selectedCollection && currentStep <= 3 && (
        <CollectionInfoBanner 
          collection={selectedCollection} 
          className="mb-6"
        />
      )}

      {/* Step 1: Upload Media */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Artwork
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Media Upload */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Primary Media *</Label>
              <p className="text-sm text-muted-foreground">
                This is the main file that will be stored on-chain. Supports images, videos, audio, and 3D models.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column - Upload button */}
                <div className="flex flex-col justify-center">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('media-upload')?.click()}
                    className="gap-2 w-[264px] h-12 mx-auto"
                  >
                    <Upload className="h-4 w-4" />
                    {formData.media_file ? 'Change Media' : 'Upload Media'}
                  </Button>
                  
                  {formData.media_file && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Selected: {formData.media_file.name}
                    </p>
                  )}
                </div>
                
                {/* Right column - Collection Avatar Preview */}
                {selectedCollection && (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-[176px] h-[176px] border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
                      {selectedCollection.image_url ? (
                        <img 
                          src={selectedCollection.image_url} 
                          alt="Collection avatar" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground cursor-help">On-chain</p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-48 text-xs">This preview shows what's stored permanently on the blockchain</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUseCollectionAvatar}
                      className="text-sm"
                    >
                      Use Collection Avatar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Cover Image *</Label>
              <p className="text-sm text-muted-foreground">
                Required thumbnail for marketplace display. This will appear in galleries and collections.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column - FileUpload */}
                <div className="flex flex-col justify-center">
                  <FileUpload
                    onFileSelect={(file) => {
                      setFormData({ ...formData, cover_image_file: file });
                    }}
                    accept="image/*"
                    currentFile={formData.cover_image_file}
                    placeholder="Click to upload"
                    aspectRatio={1}
                    maxSizeText="Max 10MB"
                    className="w-[264px] mx-auto"
                  />
                </div>
                
                {/* Right column - Collection Avatar Preview */}
                {selectedCollection && (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-[176px] h-[176px] border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
                      {selectedCollection.image_url ? (
                        <img 
                          src={selectedCollection.image_url} 
                          alt="Collection avatar" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground cursor-help">Marketplace</p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-48 text-xs">This thumbnail appears in galleries and marketplace listings</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUseCollectionCover}
                      className="text-sm"
                    >
                      Use Collection Avatar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Status */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-2">Quick Checklist</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {formData.media_file ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Circle className="h-3 w-3" />}
                      Primary media uploaded
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.cover_image_file ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Circle className="h-3 w-3" />}
                      Cover image uploaded
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*,audio/*,.glb,.gltf,.obj,.fbx"
              onChange={handleMediaUpload}
              className="hidden"
            />
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />

            <div className="flex items-center justify-between pt-4">
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isCollectionLocked && collectionId) {
                      navigate(`/collection/${collectionId}`);
                    } else {
                      navigate(-1);
                    }
                  }}
                >
                  {isCollectionLocked && collectionId ? 'Back to Collection' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!formData.media_file || !formData.cover_image_file}
                >
                  Next: Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: NFT Details */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              NFT Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Legend */}
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2">
                <Badge variant="onchain" className="text-xs">On‑Chain</Badge>
                <span className="text-xs text-muted-foreground">Stored permanently on blockchain</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="offchain" className="text-xs">Off‑Chain</Badge>
                <span className="text-xs text-muted-foreground">Stored in app database, editable</span>
              </div>
            </div>

            {/* Minting Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Minting Details</h3>
              <p className="text-sm text-muted-foreground">
                This controls how many NFTs will be minted now. It is not stored in the NFT metadata.
              </p>
              
              <div className="space-y-3">
                <Label htmlFor="quantity" className="text-base font-medium">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedCollection && selectedCollection.max_supply 
                    ? String(Math.max(1, (selectedCollection.max_supply - selectedCollection.items_redeemed))) 
                    : "1000"}
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val === '') {
                      setFormData({ ...formData, quantity: undefined });
                      return;
                    }
                    
                    const maxAllowed = selectedCollection && selectedCollection.max_supply 
                      ? Math.max(1, selectedCollection.max_supply - selectedCollection.items_redeemed)
                      : 1000;
                    
                    const n = Math.max(1, Math.min(maxAllowed, parseInt(val, 10) || 1));
                    setQuantityInput(String(n));
                    setFormData({ ...formData, quantity: n });
                  }}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedCollection && selectedCollection.max_supply ? (
                    <>
                      Up to {Math.max(0, selectedCollection.max_supply - selectedCollection.items_redeemed)} available 
                      ({selectedCollection.items_redeemed}/{selectedCollection.max_supply} minted) with automatic numbering (#1, #2, etc.)
                    </>
                  ) : (
                    'Up to 1000 NFTs with automatic numbering (#1, #2, etc.)'
                  )}
                </p>
              </div>
            </div>
            
            {/* Basic Information Section */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <Badge variant="onchain" className="text-xs">On-Chain</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This information will be permanently stored on the blockchain and cannot be changed after minting.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-medium">
                    NFT Name {!selectedCollection && "*"}
                  </Label>
                  <Input
                    id="name"
                    placeholder={selectedCollection ? `${selectedCollection.name} #1` : "My Awesome NFT"}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {selectedCollection && (
                    <p className="text-xs text-muted-foreground">
                      💡 Leave empty to auto-generate names from collection: {selectedCollection.name} #1, #2, etc.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="symbol" className="text-base font-medium">
                    Symbol
                  </Label>
                  <Input
                    id="symbol"
                    placeholder="NFT"
                    value={formData.symbol || ''}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your NFT..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Listing on Marketplace Section */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Listing on marketplace</h3>
                <Badge variant="offchain" className="text-xs">Off-Chain</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                These settings control how your NFT appears and behaves on marketplaces. Fields marked with * are required for marketplace listing.
              </p>

              <div className="space-y-6">
                {/* List for Sale Toggle */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="list-after-mint"
                      checked={formData.list_after_mint || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, list_after_mint: checked })}
                    />
                    <Label htmlFor="list-after-mint" className="text-base font-medium">
                      List for sale immediately after minting
                    </Label>
                  </div>

                  {formData.list_after_mint && (
                    <div className="ml-6 space-y-3">
                      <Label htmlFor="price" className="text-base font-medium">
                        Price (SOL) *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder={selectedCollection?.mint_price ? `Collection price: ${selectedCollection.mint_price}` : "0.1"}
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        onBlur={(e) => {
                          const raw = e.target.value.trim();
                          if (raw === '') {
                            const defaultPrice = selectedCollection?.mint_price || undefined;
                            setFormData({ ...formData, initial_price: defaultPrice });
                            if (defaultPrice) setPriceInput(String(defaultPrice));
                            return;
                          }
                          const price = Math.max(0, parseFloat(raw) || 0);
                          setPriceInput(String(price));
                          setFormData({ ...formData, initial_price: price });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Set the initial listing price for your NFT(s)
                        {selectedCollection?.mint_price && ` (Collection default: ${selectedCollection.mint_price} SOL)`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Marketplace Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-base font-medium">
                      Category<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.category || ''}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Other (default)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Art">Art</SelectItem>
                        <SelectItem value="Gaming">Gaming</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Photography">Photography</SelectItem>
                        <SelectItem value="Collectibles">Collectibles</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.category ? `Selected: ${formData.category}` : "Defaults to 'Other'"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="royalty" className="text-base font-medium">
                      Royalties (%)<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="royalty"
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      placeholder="0 (default)"
                      value={royaltyInput}
                      onChange={(e) => setRoyaltyInput(e.target.value)}
                      onBlur={(e) => {
                        const raw = e.target.value.trim().replace(',', '.');
                        if (raw === '') {
                          const defaultRoyalty = selectedCollection?.royalty_percentage || 0;
                          setFormData({ ...formData, royalty_percentage: defaultRoyalty });
                          setRoyaltyInput(String(defaultRoyalty));
                          return;
                        }
                        const r = Math.max(0, Math.min(50, parseFloat(raw)));
                        const fixed = Number.isNaN(r) ? 0 : r;
                        setRoyaltyInput(String(fixed));
                        setFormData({ ...formData, royalty_percentage: fixed });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.royalty_percentage ? `${formData.royalty_percentage}% earnings on resales` : "Defaults to 0%"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="explicit-content" className="text-base font-medium">
                      Content Declaration<span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border">
                      <Switch
                        id="explicit-content"
                        checked={formData.explicit_content || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, explicit_content: checked })}
                      />
                      <Label htmlFor="explicit-content" className="text-sm">
                        Contains explicit content
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.explicit_content ? "⚠️ Marked as explicit/sensitive" : "✅ Safe for all audiences"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Properties & Traits Section */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Properties & Traits</h3>
                <Badge variant="onchain" className="text-xs">On-Chain</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Add custom properties and traits to your NFT. These will be stored on-chain and visible on all marketplaces.
              </p>
              
              <PropertiesEditor
                properties={formData.attributes || []}
                onChange={(properties) => setFormData({ ...formData, attributes: properties })}
              />
            </div>


            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={
                  (!formData.name.trim() && !selectedCollection) || 
                  (formData.list_after_mint && (!formData.initial_price || formData.initial_price <= 0))
                }
              >
                Review & Mint
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Mint */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Review & Mint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* NFT Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">NFT Preview</h3>
                
                {/* Media Preview */}
                {(formData.media_file || formData.image_file) && (
                  <div className="w-full max-w-sm rounded-xl overflow-hidden bg-muted border-2 border-border">
                    <MediaPreview
                      file={formData.media_file || formData.image_file!}
                      previewUrl={URL.createObjectURL(formData.media_file || formData.image_file!)}
                      className="w-full"
                      aspectRatio={1}
                      enablePlayback={true}
                    />
                  </div>
                )}
                
                {/* Cover Image Preview for non-image media */}
                {formData.cover_image_file && formData.media_file && !formData.media_file.type.startsWith('image/') && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Cover Image:</Label>
                    <div className="w-full max-w-sm rounded-xl overflow-hidden bg-muted border-2 border-border">
                      <img
                        src={URL.createObjectURL(formData.cover_image_file)}
                        alt="Cover Preview"
                        className="w-full aspect-square object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Complete NFT Details Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Complete Review</h3>
                <div className="space-y-4">
                  
                  {/* Basic Information */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-sm text-primary">Basic Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {formData.name || (selectedCollection ? `${selectedCollection.name} #1` : 'Untitled')}</div>
                      <div><strong>Symbol:</strong> {formData.symbol || 'NFT'}</div>
                      {(formData.description || selectedCollection?.description) && (
                        <div><strong>Description:</strong> {formData.description || selectedCollection?.description}</div>
                      )}
                      <div><strong>Category:</strong> {formData.category || 'Other'}</div>
                    </div>
                  </div>

                  {/* Minting Details */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-sm text-primary">Minting Details</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Quantity:</strong> {formData.quantity || 1} {(formData.quantity || 1) > 1 ? 'NFTs' : 'NFT'}</div>
                      <div><strong>Creator Royalties:</strong> {formData.royalty_percentage ?? 0}%</div>
                      {selectedCollection && (
                        <div><strong>Collection:</strong> {selectedCollection.name}</div>
                      )}
                    </div>
                  </div>

                  {/* Properties & Attributes */}
                  {formData.attributes && formData.attributes.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-medium text-sm text-primary">Properties</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.attributes.map((attr, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {attr.trait_type}: {attr.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content & Listing Settings */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-sm text-primary">Settings</h4>
                    <div className="space-y-1 text-sm">
                      <div className={formData.explicit_content ? "text-amber-600" : ""}>
                        <strong>Explicit Content:</strong> {formData.explicit_content ? '⚠️ Yes' : '✅ No'}
                      </div>
                      <div className={formData.list_after_mint ? "text-green-600" : ""}>
                        <strong>List After Mint:</strong> {formData.list_after_mint 
                          ? `✅ Yes (${formData.initial_price || selectedCollection?.mint_price || 0} SOL)` 
                          : '❌ No'
                        }
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleMint} 
                disabled={minting || !publicKey}
                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]"
                size="lg"
              >
                {minting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                    Minting...
                  </>
                ) : !publicKey ? (
                  'Connect Wallet'
                ) : (
                  <>
                    🎨 Mint {(formData.quantity || 1) > 1 ? `${formData.quantity} NFTs` : 'NFT'}
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Congratulations */}
      {currentStep === 4 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Congratulations!</CardTitle>
            <p className="text-muted-foreground">
              Your {(formData.quantity || 1) > 1 ? `${formData.quantity} NFTs have` : 'NFT has'} been successfully minted!
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            
            {/* Success Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-green-800">Minting Complete</h3>
              <p className="text-sm text-green-700">
                {(formData.quantity || 1) > 1 
                  ? `${formData.quantity} NFTs have been created` 
                  : 'Your NFT has been created'
                } and {formData.list_after_mint ? 'listed for sale' : 'added to your collection'}.
              </p>
            </div>

            {/* What's Next */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What's Next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* View Your NFTs */}
                <Button
                  onClick={() => navigate('/profile?tab=nfts')}
                  className="flex items-center justify-center gap-2 h-auto p-4"
                  variant="default"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">📂</div>
                    <div className="font-medium">View My NFTs</div>
                    <div className="text-xs opacity-80">See all your created NFTs</div>
                  </div>
                </Button>

                {/* Create Collection */}
                <Button
                  onClick={() => navigate('/mint/collection')}
                  className="flex items-center justify-center gap-2 h-auto p-4"
                  variant="outline"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">🎨</div>
                    <div className="font-medium">Create Collection</div>
                    <div className="text-xs opacity-80">Organize NFTs in collections</div>
                  </div>
                </Button>

                {/* Mint Another */}
                <Button
                  onClick={handleStartNew}
                  className="flex items-center justify-center gap-2 h-auto p-4"
                  variant="outline"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">➕</div>
                    <div className="font-medium">Mint Another NFT</div>
                    <div className="text-xs opacity-80">Create more unique pieces</div>
                  </div>
                </Button>

                {/* View Marketplace */}
                <Button
                  onClick={() => navigate('/marketplace')}
                  className="flex items-center justify-center gap-2 h-auto p-4"
                  variant="outline"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">🏪</div>
                    <div className="font-medium">Explore Marketplace</div>
                    <div className="text-xs opacity-80">Discover other creators</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Share & Promotion */}
            {formData.list_after_mint && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-blue-800">Your NFT is Listed!</h4>
                <p className="text-sm text-blue-700">
                  Listed for {formData.initial_price || selectedCollection?.mint_price || 0} SOL. 
                  Share it with your community to get the first buyers!
                </p>
              </div>
            )}
            
          </CardContent>
        </Card>
      )}

    </div>
    </TooltipProvider>
  );
};