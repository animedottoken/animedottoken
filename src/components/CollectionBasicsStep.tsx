import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PropertiesEditor, Property } from '@/components/PropertiesEditor';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowLeft, Palette, Users, Infinity, Calendar as CalendarIcon } from 'lucide-react';

interface FormData {
  name: string;
  symbol: string;
  site_description: string;
  onchain_description: string;
  category: string;
  explicit_content: boolean;
  enable_primary_sales: boolean;
  mint_price: number;
  supply_mode: string;
  max_supply: number;
  mint_end_at: string;
  mint_end_at_error?: string;
  attributes: Property[];
}

interface CollectionBasicsStepProps {
  formData: {
    name: string;
    symbol: string;
    site_description: string;
    onchain_description: string;
    category: string;
    explicit_content: boolean;
    enable_primary_sales: boolean;
    mint_price: number;
    supply_mode: string;
    max_supply: number;
    mint_end_at: string;
    mint_end_at_error?: string;
    attributes: Property[];
  };
  setFormData: (data: any) => void;
  mintPriceInput: string;
  setMintPriceInput: (value: string) => void;
  onNext: () => void;
}

export const CollectionBasicsStep: React.FC<CollectionBasicsStepProps> = ({
  formData,
  setFormData,
  mintPriceInput,
  setMintPriceInput,
  onNext
}) => {
  return (
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
          <Button variant="outline" onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/mint'} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to mint options
          </Button>
          <Button onClick={onNext} disabled={!formData.name.trim()} className="w-full sm:w-auto">
            Next: Upload Images
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};