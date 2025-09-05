import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from "@/components/ui/slider";
import { FileUpload } from '@/components/ui/file-upload';
import { ArrowRight, Settings } from 'lucide-react';

interface FormData {
  image_file: File | null;
  banner_file: File | null;
  image_preview_url: string | null;
  banner_preview_url: string | null;
  royalty_percentage: number;
  treasury_wallet: string;
  whitelist_enabled: boolean;
}

interface CollectionSettingsStepProps {
  formData: {
    image_file: File | null;
    banner_file: File | null;
    image_preview_url: string | null;
    banner_preview_url: string | null;
    royalty_percentage: number;
    treasury_wallet: string;
    whitelist_enabled: boolean;
  };
  setFormData: (data: any) => void;
  publicKey: string;
  onBack: () => void;
  onNext: () => void;
  onConnectWallet?: () => void;
  royaltyInput?: string;
  setRoyaltyInput?: (value: string) => void;
}

export const CollectionSettingsStep: React.FC<CollectionSettingsStepProps> = ({
  formData,
  setFormData,
  publicKey,
  onBack,
  onNext,
  onConnectWallet,
  royaltyInput = '',
  setRoyaltyInput
}) => {
  return (
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
                type="text"
                placeholder="0.00"
                value={royaltyInput || formData.royalty_percentage.toString()}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (setRoyaltyInput) {
                    setRoyaltyInput(inputValue);
                  }
                  
                  // Parse and validate the number
                  const numValue = parseFloat(inputValue);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
                    setFormData({ ...formData, royalty_percentage: numValue });
                  }
                }}
                onBlur={() => {
                  // Ensure valid number on blur
                  const numValue = parseFloat(royaltyInput || formData.royalty_percentage.toString());
                  if (isNaN(numValue) || numValue < 0) {
                    const finalValue = 0;
                    setFormData({ ...formData, royalty_percentage: finalValue });
                    if (setRoyaltyInput) setRoyaltyInput(finalValue.toString());
                  } else if (numValue > 50) {
                    const finalValue = 50;
                    setFormData({ ...formData, royalty_percentage: finalValue });
                    if (setRoyaltyInput) setRoyaltyInput(finalValue.toString());
                  }
                }}
                className="w-24 text-center text-sm sm:text-base"
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
          {!publicKey ? (
            <div className="space-y-2">
              <Input
                id="treasury_wallet"
                type="text"
                placeholder="Enter wallet address or connect wallet"
                value={formData.treasury_wallet || ''}
                onChange={(e) => setFormData({ ...formData, treasury_wallet: e.target.value })}
                className="text-xs sm:text-sm font-mono"
              />
              <div className="flex justify-start">
                <Button variant="outline" size="sm" onClick={onConnectWallet}>
                  Connect Wallet
                </Button>
              </div>
            </div>
          ) : (
            <Input
              id="treasury_wallet"
              type="text"
              placeholder={publicKey}
              value={formData.treasury_wallet || publicKey || ''}
              onChange={(e) => setFormData({ ...formData, treasury_wallet: e.target.value })}
              disabled={!!publicKey}
              className="text-xs sm:text-sm font-mono"
            />
          )}
          <div className="text-xs text-muted-foreground">
            Wallet address to receive royalties {!publicKey && "(Connect wallet or enter manually)"}
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
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
            Back
          </Button>
          <Button onClick={onNext} disabled={!formData.image_file} className="w-full sm:w-auto">
            Next: Review
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};