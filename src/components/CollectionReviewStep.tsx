import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface FormData {
  name: string;
  symbol: string;
  category: string;
  explicit_content: boolean;
  image_file: File | null;
  image_preview_url: string | null;
  banner_file: File | null;
  banner_preview_url: string | null;
  onchain_description: string;
  mint_price: number;
  supply_mode: string;
  max_supply: number;
  royalty_percentage: number;
  whitelist_enabled: boolean;
  enable_primary_sales: boolean;
  mint_end_at_error?: string;
}

interface CollectionReviewStepProps {
  formData: {
    name: string;
    symbol: string;
    category: string;
    explicit_content: boolean;
    image_file: File | null;
    image_preview_url: string | null;
    banner_file: File | null;
    banner_preview_url: string | null;
    onchain_description: string;
    mint_price: number;
    supply_mode: string;
    max_supply: number;
    royalty_percentage: number;
    whitelist_enabled: boolean;
    enable_primary_sales: boolean;
    mint_end_at_error?: string;
  };
  isMinting: boolean;
  mintNow: boolean;
  setMintNow: (value: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export const CollectionReviewStep: React.FC<CollectionReviewStepProps> = ({
  formData,
  isMinting,
  mintNow,
  setMintNow,
  onBack,
  onSubmit
}) => {
  return (
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
      <CardContent className="px-4 sm:px-6 space-y-6">
        {/* Collection Preview */}
        <div className="bg-muted/30 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {formData.image_file && (
              <img 
                src={formData.image_preview_url || URL.createObjectURL(formData.image_file)}
                alt="Collection preview"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-border"
              />
            )}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold">{formData.name}</h3>
              {formData.symbol && (
                <Badge variant="secondary" className="mt-1">{formData.symbol}</Badge>
              )}
              <p className="text-sm text-muted-foreground mt-2">{formData.category}</p>
            </div>
          </div>
        </div>

        {/* Key Details - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="bg-muted/20 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="font-bold">{formData.mint_price} SOL</div>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Supply</div>
              <div className="font-bold">
                {formData.supply_mode === 'open' ? '∞ Open' : `${formData.max_supply} Max`}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-muted/20 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Royalties</div>
              <div className="font-bold">{formData.royalty_percentage.toFixed(2)}%</div>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Whitelist</div>
              <div className="font-bold">{formData.whitelist_enabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        </div>

        {/* Descriptions - Mobile Optimized */}
        {formData.onchain_description && (
          <div className="bg-muted/20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-2">On-Chain Description</div>
            <div className="text-sm text-muted-foreground">{formData.onchain_description}</div>
          </div>
        )}

        {/* Mint Toggle */}
        <div className="bg-muted/20 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Mint on-chain now</div>
              <div className="text-sm text-muted-foreground">
                {mintNow ? 'Collection will be minted on-chain immediately' : 'Collection will be created off-chain only'}
              </div>
            </div>
            <Switch
              checked={mintNow}
              onCheckedChange={setMintNow}
            />
          </div>
        </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
            Back to Settings
          </Button>
          <Button 
            onClick={onSubmit} 
            size="lg"
            disabled={!!formData.mint_end_at_error || isMinting || !formData.image_file}
            className="w-full sm:w-auto"
          >
            {isMinting ? (mintNow ? 'Creating & Minting...' : 'Creating...') : (mintNow ? 'Create + Mint' : 'Create Off-Chain')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};