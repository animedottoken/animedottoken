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
import { ArrowRight, ArrowLeft, Upload, FileText, CheckCircle } from 'lucide-react';
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

export const StandaloneMintWizard = () => {
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
    if (currentStep === 1 && !formData.media_file && !formData.image_file) {
      toast.error('Please upload media first');
      return;
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

  return (
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

      {/* Collection Info Banner */}
      {selectedCollection && currentStep === 1 && (
        <CollectionInfoBanner 
          collection={selectedCollection} 
          className="mb-6"
        />
      )}

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

      {/* Step 1: Upload Media */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Your NFT Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              {/* Primary Media Upload */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Primary Media *
                </Label>
                <p className="text-sm text-muted-foreground">
                  Upload your main NFT content. Supported formats: Images (PNG, JPEG, GIF), Videos (MP4, WebM), Audio (MP3, WAV, M4A, OGG), 3D Models (GLB, GLTF). Preview will appear in Review step.
                </p>
                <div className="space-y-4">
                  <FileUpload
                    onFileSelect={(file) => {
                      setFormData({ 
                        ...formData, 
                        media_file: file || undefined,
                        // For backwards compatibility, also set image_file if it's an image
                        image_file: file && file.type.startsWith('image/') ? file : formData.image_file
                      });
                    }}
                    accept="image/*,video/mp4,video/webm,audio/mpeg,audio/wav,audio/m4a,audio/ogg,.glb,.gltf"
                    placeholder="Upload Primary Media"
                    maxSizeText="All media formats supported"
                    className="w-full"
                    aspectRatio={0.6}
                    currentFile={formData.media_file}
                    showPreview={false}
                  />
                  
                  {/* Option to use collection avatar - always show when collection is selected */}
                  {selectedCollection?.image_url && (
                    <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <img
                        src={selectedCollection.image_url}
                        alt={selectedCollection.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Use Collection Avatar</p>
                        <p className="text-xs text-muted-foreground">Use the collection's image as your NFT media</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={formData.media_file?.name?.includes(selectedCollection.name)}
                        onClick={() => {
                          fetch(selectedCollection.image_url!)
                            .then(response => response.blob())
                            .then(blob => {
                              const file = new File([blob], `${selectedCollection.name}-avatar.png`, { type: blob.type });
                              setFormData({ ...formData, media_file: file, image_file: file });
                              toast.success('Collection avatar loaded!');
                            })
                            .catch(() => toast.error('Failed to load collection avatar'));
                        }}
                      >
                        {formData.media_file?.name?.includes(selectedCollection.name) ? 'Using' : 'Use'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Image Upload for Video/Audio */}
              {formData.media_file && 
               (formData.media_file.type.startsWith('video/') || 
                formData.media_file.type.startsWith('audio/') ||
                formData.media_file.name.toLowerCase().endsWith('.glb') ||
                formData.media_file.name.toLowerCase().endsWith('.gltf')) && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Cover Image (Required for video/audio/3D)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add a cover image to improve how your NFT appears in galleries and marketplaces. Preview will appear in Review step.
                  </p>
                  <div className="space-y-4">
                    <FileUpload
                      onFileSelect={(file) => {
                        setFormData({ ...formData, cover_image_file: file || undefined });
                      }}
                      accept="image/*"
                      placeholder="Upload Cover Image"
                      maxSizeText="JPEG, PNG recommended"
                      className="w-full max-w-md"
                      aspectRatio={1}
                      currentFile={formData.cover_image_file}
                      showPreview={false}
                    />
                    
                    {/* Option to use collection avatar as cover */}
                    {selectedCollection?.image_url && (
                      <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20 max-w-md">
                        <img
                          src={selectedCollection.image_url}
                          alt={selectedCollection.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Use Collection Cover</p>
                          <p className="text-xs text-muted-foreground">Use collection image as cover</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={formData.cover_image_file?.name?.includes(selectedCollection.name)}
                          onClick={() => {
                            fetch(selectedCollection.image_url!)
                              .then(response => response.blob())
                              .then(blob => {
                                const file = new File([blob], `${selectedCollection.name}-cover.png`, { type: blob.type });
                                setFormData({ ...formData, cover_image_file: file });
                                toast.success('Collection cover loaded!');
                              })
                              .catch(() => toast.error('Failed to load collection cover'));
                          }}
                        >
                          {formData.cover_image_file?.name?.includes(selectedCollection.name) ? 'Using' : 'Use'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Helpful tips */}
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">💡 Tips for best results:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Images & GIFs:</strong> Will display directly and animate where supported</li>
                  <li>• <strong>Videos:</strong> Will show with play controls - <strong>cover image required</strong></li>
                  <li>• <strong>Audio:</strong> Will display with audio player - <strong>cover image required</strong></li>
                  <li>• <strong>3D Models:</strong> GLB/GLTF format supported - <strong>cover image required</strong></li>
                  <li>• <strong>No real funds:</strong> This is a simulation for demonstration only</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              {/* Cover required warning */}
              {(formData.media_file && !formData.media_file.type.startsWith('image/') && !formData.cover_image_file) && (
                <p className="text-xs text-destructive">Cover image is required for video, audio, or 3D media.</p>
              )}

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
                  Cancel
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={(!formData.media_file && !formData.image_file) ||
                    (formData.media_file && !formData.media_file.type.startsWith('image/') && !formData.cover_image_file)}
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
          <CardContent className="space-y-6">
            {/* Essential Information */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-medium">
                    NFT Name *
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

              {/* Explicit Content - Prominent and Required */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="explicit-content" className="text-base font-medium">
                        Content Declaration
                      </Label>
                      <Badge variant="required" className="text-xs">Required for Marketplace</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Declare if your NFT contains explicit or sensitive content
                    </p>
                  </div>
                  <Switch
                    id="explicit-content"
                    checked={formData.explicit_content || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, explicit_content: checked })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.explicit_content ? "⚠️ Marked as explicit/sensitive" : "✅ Safe for all audiences"}
                </p>
              </div>
            </div>

            {/* Advanced Settings - Collapsible */}
            <div className="space-y-4 pt-6 border-t">
              <details className="space-y-4">
                <summary className="cursor-pointer text-base font-medium text-muted-foreground hover:text-foreground transition-colors">
                  ⚙️ Advanced Settings (Optional)
                </summary>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-4 pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="category" className="text-base font-medium">
                        Category
                      </Label>
                      <Badge variant="required" className="text-xs">Required for Marketplace</Badge>
                    </div>
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
                    <Label htmlFor="quantity" className="text-base font-medium">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="1000"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val === '') {
                          setFormData({ ...formData, quantity: undefined });
                          return;
                        }
                        const n = Math.max(1, Math.min(1000, parseInt(val, 10) || 1));
                        setQuantityInput(String(n));
                        setFormData({ ...formData, quantity: n });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {(formData.quantity || 1) > 100 
                        ? selectedCollectionId 
                          ? "Large quantities will be processed in the background"
                          : "Large quantities will be processed in batches"
                        : "Up to 1000 NFTs with automatic numbering (#1, #2, etc.)"
                      }
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="royalty" className="text-base font-medium">
                        Royalties (%)
                      </Label>
                      <Badge variant="required" className="text-xs">Required for Marketplace</Badge>
                    </div>
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
                </div>
              </details>
            </div>

            {/* Listing Options */}
            <div className="space-y-6 pt-6 border-t">
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
            </div>

            {/* Properties Section */}
            <PropertiesEditor
              properties={formData.attributes || []}
              onChange={(properties) => setFormData({ ...formData, attributes: properties })}
              className="mt-6"
            />

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={currentStep === 2 && !formData.name.trim() && !selectedCollection}>
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
                
                {selectedCollection && (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <h4 className="font-medium text-sm mb-2">Part of Collection:</h4>
                    <div className="flex items-center gap-3">
                      {selectedCollection.image_url && (
                        <img 
                          src={selectedCollection.image_url} 
                          alt={selectedCollection.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm">{selectedCollection.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedCollection.symbol}</p>
                      </div>
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
  );
};