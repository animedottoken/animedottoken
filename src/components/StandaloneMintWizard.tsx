import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Upload, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { useStandaloneMint, StandaloneNFTData } from '@/hooks/useStandaloneMint';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useCollection } from '@/hooks/useCollection';
import { toast } from 'sonner';

const STEPS = [
  { number: 1, title: 'Upload Artwork', icon: Upload },
  { number: 2, title: 'NFT Details', icon: FileText },
  { number: 3, title: 'Review & Mint', icon: CheckCircle }
];

export const StandaloneMintWizard = () => {
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collection');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<StandaloneNFTData>({
    name: '',
    symbol: 'NFT',
    description: '',
    image_file: undefined,
    quantity: 1,
    royalty_percentage: 0,
    category: '',
    external_links: [],
    attributes: []
  });

  const { minting, mintStandaloneNFT } = useStandaloneMint();
  const { publicKey } = useSolanaWallet();
  const { collection, loading: collectionLoading } = useCollection(collectionId || '');

  const handleNext = () => {
    if (currentStep === 1 && !formData.image_file) {
      toast.error('Please upload an image first');
      return;
    }
    if (currentStep === 2 && !formData.name.trim()) {
      toast.error('Please enter an NFT name');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
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
      // Reset form after successful mint
      setFormData({
        name: '',
        symbol: 'NFT',
        description: '',
        image_file: undefined,
        quantity: 1,
        royalty_percentage: 0,
        category: '',
        external_links: [],
        attributes: []
      });
      setCurrentStep(1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Collection Context Banner */}
      {collectionId && collection && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {collection.image_url && (
                <img 
                  src={collection.image_url} 
                  alt={collection.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Minting NFT for collection:</p>
                <h3 className="font-semibold">{collection.name}</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/mint/collection'}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{step.title}</span>
                  <Badge variant={isActive ? 'secondary' : 'outline'}>
                    {step.number}
                  </Badge>
                </div>
                {index < STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
              </div>
            );
          })}
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
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setFormData({ ...formData, image_file: file });
                }}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Upload your NFT artwork (JPEG, PNG, GIF supported)
              </p>
            </div>

            {formData.image_file && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview:</p>
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={URL.createObjectURL(formData.image_file)}
                    alt="NFT Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

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
                  max="100"
                  value={formData.quantity || 1}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
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
                  value={formData.royalty_percentage || 0}
                  onChange={(e) => setFormData({ ...formData, royalty_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

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
    </div>
  );
};