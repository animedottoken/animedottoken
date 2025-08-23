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

const STEPS = [
  { number: 1, title: 'Upload Artwork', icon: Upload },
  { number: 2, title: 'NFT Details', icon: FileText },
  { number: 3, title: 'Review & Mint', icon: CheckCircle },
  { number: 4, title: 'Success!', icon: CheckCircle }
];

export const StandaloneMintWizard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const collectionId = searchParams.get('collection');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(collectionId);
  const [formData, setFormData] = useState<StandaloneNFTData>({
    name: '',
    symbol: 'NFT',
    description: '',
    image_file: undefined,
    quantity: 1,
    royalty_percentage: 0,
    category: '',
    external_links: [],
    attributes: [],
    collection_id: collectionId || undefined,
    explicit_content: false,
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

  // Update formData when selectedCollectionId changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      collection_id: selectedCollectionId || undefined
    }));
  }, [selectedCollectionId]);

  const handleCollectionChange = (value: string) => {
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
    if (currentStep === 1 && !formData.image_file) {
      toast.error('Please upload an image first');
      return;
    }
    if (currentStep === 2 && !formData.name.trim()) {
      toast.error('Please enter an NFT name');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
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
      // Move to success screen instead of resetting
      setCurrentStep(4);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Collection Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Collection</Label>
            <Select
              value={selectedCollectionId || 'none'}
              onValueChange={handleCollectionChange}
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
            {selectedCollection && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                {selectedCollection.image_url && (
                  <img 
                    src={selectedCollection.image_url} 
                    alt={selectedCollection.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Selected collection:</p>
                  <p className="font-medium">{selectedCollection.name}</p>
                  {selectedCollection.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedCollection.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {selectedCollection.mint_price > 0 && (
                      <span>Collection mint price: {selectedCollection.mint_price} SOL</span>
                    )}
                    <span>Available: {selectedCollection.items_available}/{selectedCollection.max_supply}</span>
                  </div>
                </div>
              </div>
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
          <p className="text-xs sm:text-sm text-muted-foreground">Step {currentStep} of {STEPS.length}</p>
        </div>
      </div>

      {/* Step 1: Upload Artwork */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Your Artwork
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="image" className="text-base font-medium">
                NFT Image
              </Label>
              <FileUpload
                onFileSelect={(file) => {
                  setFormData({ ...formData, image_file: file || undefined });
                }}
                accept="image/*"
                placeholder="Click to upload image"
                maxSizeText="JPEG, PNG, GIF supported"
                className="w-full"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={!formData.image_file}>
                Next: Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-base font-medium">
                  NFT Name *
                </Label>
                <Input
                  id="name"
                  placeholder="My Awesome NFT"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-medium">
                  Category
                </Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="royalty" className="text-base font-medium">
                  Royalties (%)
                </Label>
                <Input
                  id="royalty"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={royaltyInput}
                  onChange={(e) => setRoyaltyInput(e.target.value)}
                  onBlur={(e) => {
                    const raw = e.target.value.trim().replace(',', '.');
                    if (raw === '') {
                      setFormData({ ...formData, royalty_percentage: undefined });
                      return;
                    }
                    const r = Math.max(0, Math.min(10, parseFloat(raw)));
                    const fixed = Number.isNaN(r) ? 0 : r;
                    setRoyaltyInput(String(fixed));
                    setFormData({ ...formData, royalty_percentage: fixed });
                  }}
                />
              </div>
            </div>

            {/* Content & Listing Options */}
            <div className="space-y-6 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  id="explicit-content"
                  checked={formData.explicit_content || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, explicit_content: checked })}
                />
                <Label htmlFor="explicit-content" className="text-base font-medium">
                  Contains explicit or sensitive content
                </Label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="list-after-mint"
                    checked={formData.list_after_mint || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, list_after_mint: !!checked })}
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
                      placeholder="0.1"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        if (raw === '') {
                          setFormData({ ...formData, initial_price: undefined });
                          return;
                        }
                        const price = Math.max(0, parseFloat(raw) || 0);
                        setPriceInput(String(price));
                        setFormData({ ...formData, initial_price: price });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Set the initial listing price for your NFT(s)
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
              <Button onClick={handleNext} disabled={!formData.name.trim()}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NFT Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold">NFT Preview</h3>
                {formData.image_file && (
                  <div className="w-full max-w-sm rounded-lg overflow-hidden bg-muted">
                    <img
                      src={URL.createObjectURL(formData.image_file)}
                      alt="NFT Preview"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                )}
              </div>

              {/* NFT Details Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold">Details Summary</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {formData.name}</div>
                  <div><strong>Symbol:</strong> {formData.symbol}</div>
                  {formData.description && <div><strong>Description:</strong> {formData.description}</div>}
                  {formData.category && <div><strong>Category:</strong> {formData.category}</div>}
                  <div><strong>Quantity:</strong> {formData.quantity}</div>
                  <div><strong>Royalties:</strong> {formData.royalty_percentage}%</div>
                  {formData.explicit_content && (
                    <div className="text-amber-600"><strong>⚠️ Explicit Content:</strong> Yes</div>
                  )}
                  {formData.list_after_mint && (
                    <div className="text-green-600">
                      <strong>✓ List After Mint:</strong> {formData.initial_price} SOL
                    </div>
                  )}
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
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {minting ? 'Minting...' : !publicKey ? 'Connect Wallet' : `Mint NFT${(formData.quantity || 1) > 1 ? 's' : ''}`}
                {!minting && <CheckCircle className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success Screen */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Congratulations! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">NFT Minted Successfully!</h3>
                <p className="text-muted-foreground">
                  Your {formData.quantity > 1 ? `${formData.quantity} NFTs` : 'NFT'} "{formData.name}" {formData.quantity > 1 ? 'have' : 'has'} been created on the Solana blockchain.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">NFT Details:</h4>
              <div className="space-y-1 text-sm">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Quantity:</strong> {formData.quantity}</div>
                {formData.list_after_mint && (
                  <div><strong>Listed for:</strong> {formData.initial_price} SOL</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">What's next?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={() => {
                    // Reset form and go to step 1
                    setFormData({
                      name: '',
                      symbol: 'NFT',
                      description: '',
                      image_file: undefined,
                      quantity: 1,
                      royalty_percentage: 0,
                      category: '',
                      external_links: [],
                      attributes: [],
                      collection_id: selectedCollectionId || undefined,
                      explicit_content: false,
                      list_after_mint: false,
                      initial_price: undefined
                    });
                    setQuantityInput('1');
                    setRoyaltyInput('0');
                    setPriceInput('');
                    setCurrentStep(1);
                  }}
                  className="flex-1"
                >
                  🎨 Mint Another NFT
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/mint/collection')}
                  className="flex-1"
                >
                  📦 Create Collection
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  className="flex-1"
                >
                  👤 Go to Profile
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/marketplace')}
                  className="flex-1"
                >
                  🛒 Browse Marketplace
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};