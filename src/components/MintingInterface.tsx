import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MintInput as Input } from '@/components/ui/mint-input';
import { Label } from '@/components/ui/label';
import { Clock, Users, Zap, Shield, Plus, Minus, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useMintQueue } from '@/hooks/useMintQueue';
import { MintQueueStatus } from '@/components/MintQueueStatus';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';

interface Collection {
  id: string;
  name: string;
  description: string;
  image_url: string;
  banner_image_url?: string | null;
  mint_price: number;
  max_supply: number;
  items_redeemed: number;
  is_live: boolean;
  go_live_date: string | null;
  whitelist_enabled: boolean;
  symbol?: string;
  items_available?: number;
  is_active?: boolean;
  creator_address?: string;
  treasury_wallet?: string;
  royalty_percentage?: number;
}

interface NFTDetails {
  nftImageFile: File | null;
  nftImagePreview: string | null;
  nftName: string;
  nftDescription: string;
  nftAttributes: Array<{ trait_type: string; value: string }>;
}

interface MintingInterfaceProps {
  collectionId?: string;
  nftDetails?: NFTDetails;
  embedded?: boolean; // Hide header and left preview when embedded
}

export const MintingInterface = ({ collectionId = '123e4567-e89b-12d3-a456-426614174000', nftDetails, embedded = false }: MintingInterfaceProps) => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { createMintJob, creating, jobs, loading: queueLoading, getJobProgress } = useMintQueue();
  const { connected } = useSolanaWallet();

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      console.log('Loading collection:', collectionId);
      const { data, error } = await supabase
        .rpc('get_collection_details', { collection_id: collectionId });

      console.log('Collection query result:', { data, error });

      if (data && data.length > 0) {
        setCollection(data[0]);
      } else if (collectionId && collectionId !== '123e4567-e89b-12d3-a456-426614174000') {
        // Don't create sample collection when a real collectionId is provided
        console.error('Collection not found for ID:', collectionId);
        setCollection(null);
      } else {
        console.log('No collection found, creating sample collection');
        // Create sample collection if none exists (only for default/demo ID)
        await createSampleCollection();
      }
    } catch (error) {
      console.error('Error loading collection:', error);
      if (collectionId && collectionId !== '123e4567-e89b-12d3-a456-426614174000') {
        // Don't create sample collection when a real collectionId is provided
        setCollection(null);
      } else {
        await createSampleCollection();
      }
    } finally {
      setCollectionLoading(false);
    }
  };

  const createSampleCollection = async () => {
    try {
      console.log('Creating sample collection...');
      const sampleCollection = {
        id: collectionId,
        name: 'ANIME ARMY Genesis',
        symbol: 'AAGEN',
        description: 'The first collection of ANIME ARMY NFTs featuring unique anime-style characters with special powers and abilities.',
        image_url: '/images/og-anime.jpg',
        max_supply: 10000,
        items_available: 10000,
        items_redeemed: 2847,
        mint_price: 0,
        creator_address: 'ANiMeArMyCreator1234567890',
        treasury_wallet: 'ANiMeArMyTreasury1234567890',
        royalty_percentage: 5,
        is_active: true,
        is_live: true,
        whitelist_enabled: false
      };

      const { data, error } = await supabase
        .from('collections')
        .upsert(sampleCollection, { onConflict: 'id' })
        .select()
        .single();

      console.log('Sample collection result:', { data, error });

      if (error) {
        console.error('Failed to create sample collection:', error);
        // Try to create a fallback collection in state
        setCollection({
          id: 'fallback-collection',
          ...sampleCollection,
          go_live_date: null
        });
      } else if (data) {
        setCollection(data);
      }
    } catch (error) {
      console.error('Error in createSampleCollection:', error);
      // Set fallback collection for demo purposes
      setCollection({
        id: 'fallback-collection',
        name: 'ANIME ARMY Genesis',
        symbol: 'AAGEN',
        description: 'The first collection of ANIME ARMY NFTs featuring unique anime-style characters with special powers and abilities.',
        image_url: '/images/og-anime.jpg',
        max_supply: 10000,
        items_available: 10000,
        items_redeemed: 2847,
        mint_price: 0,
        creator_address: 'ANiMeArMyCreator1234567890',
        treasury_wallet: 'ANiMeArMyTreasury1234567890',
        royalty_percentage: 5,
        is_active: true,
        is_live: true,
        whitelist_enabled: false,
        go_live_date: null
      });
    }
  };

  const handleMint = async () => {
    if (!collection || !connected) return;
    
    // Check if artwork is required and missing
    if (!nftDetails?.nftImageFile && !nftDetails?.nftImagePreview) {
      toast.error('Please upload NFT artwork before minting.');
      return;
    }
    
    const result = await createMintJob(collection.id, quantity, nftDetails);
    if (result.success) {
      setQuantity(1); // Reset quantity after successful job creation
      // Show toast with link to profile mint queue
      toast.success('🎉 Mint job created! Your NFTs are being minted. You can track them in your Profile.', {
        action: {
          label: 'Go to Profile',
          onClick: () => { window.location.href = '/profile'; }
        }
      });
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, maxPerJob));
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.min(Math.max(value, 1), maxPerJob));
  };

  const mintProgress = collection ? (collection.items_redeemed / collection.max_supply) * 100 : 0;
  const isLive = collection?.is_live && connected;
  const isSoldOut = collection ? collection.items_redeemed >= collection.max_supply : false;
  const remainingSupply = collection ? collection.max_supply - collection.items_redeemed : 0;
  const totalCost = collection ? collection.mint_price * quantity : 0;
  const maxPerJob = Math.min(1000, remainingSupply);

  if (collectionLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading collection...</p>
        </CardContent>
      </Card>
    );
  }

  if (!collection) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Collection not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={embedded ? "space-y-6 -mr-4" : "w-full max-w-6xl space-y-6"}>
      <Card>
        {!embedded && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                🔥 {collection.name} - Collection NFTs
              </CardTitle>
              <div className="flex gap-2">
                {!collection.is_live && <Badge variant="secondary" className="bg-orange-500 text-white">PAUSED</Badge>}
                {collection.is_live && !isSoldOut && <Badge className="bg-green-500 text-white">LIVE</Badge>}
                {isSoldOut && <Badge variant="destructive">SOLD OUT</Badge>}
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className="space-y-6">
          <div className={embedded ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 gap-8"}>
            {!embedded && (
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg bg-muted relative">
                  <img 
                    src={nftDetails?.nftImagePreview || collection.image_url || collection.banner_image_url || "/placeholder.svg"} 
                    alt={nftDetails?.nftName || collection.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src !== "/placeholder.svg") {
                        img.src = "/placeholder.svg";
                      }
                    }}
                  />
                  {!nftDetails?.nftImagePreview && !collection.image_url && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm text-center p-4">
                      <div>
                        <div className="mb-2">Your artwork preview</div>
                        <div className="text-xs">Upload artwork in the section above</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Price per NFT</Label>
                    <div className="font-bold text-lg text-green-600">
                      {collection.mint_price === 0 ? 'FREE' : `${collection.mint_price} SOL`}
                    </div>
                    {collection.mint_price === 0 && (
                      <div className="text-xs text-muted-foreground">+ gas fees (~$0.01 each)</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Collection Supply</Label>
                    <div className="font-bold">{collection.max_supply.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{remainingSupply.toLocaleString()} remaining</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Quantity Selector - Main section */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label htmlFor="quantity" className="text-lg font-semibold">
                  Quantity to Mint
                </Label>
                {/* +/- buttons and input on one row */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1 || creating}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={maxPerJob}
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-20 text-center"
                    disabled={creating}
                    autoComplete="off"
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={incrementQuantity}
                    disabled={quantity >= maxPerJob || creating}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Max per job and Collection details in new row with smaller text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Max per job: {maxPerJob}</div>
                  <div>Collection Max Supply: {collection.max_supply.toLocaleString()} • Remaining: {remainingSupply.toLocaleString()}</div>
                </div>

                {/* Minted progress - moved under quantity */}
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Minted</span>
                    <span>{collection.items_redeemed.toLocaleString()} / {collection.max_supply.toLocaleString()}</span>
                  </div>
                  <Progress value={mintProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    {(100 - mintProgress).toFixed(1)}% remaining
                  </div>
                </div>
                
                {/* Total Cost */}
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-medium">Total Cost:</span>
                  <span className="font-bold text-lg">
                    {totalCost === 0 ? 'FREE' : `${totalCost.toFixed(4)} SOL`}
                  </span>
                </div>
              </div>

              {/* Mint Button */}
              <Button 
                onClick={handleMint}
                disabled={!isLive || creating || isSoldOut || quantity > remainingSupply || (!nftDetails?.nftImageFile && !nftDetails?.nftImagePreview)}
                className="w-full py-6 text-lg font-semibold"
                size="lg"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Job...
                  </>
                ) : isSoldOut ? (
                  'SOLD OUT'
                ) : !connected ? (
                  'Connect Wallet to Mint'
                ) : (!nftDetails?.nftImageFile && !nftDetails?.nftImagePreview) ? (
                  'Upload Artwork Required'
                ) : quantity > remainingSupply ? (
                  `Only ${remainingSupply} Left`
                ) : (
                  `Queue ${quantity} NFT${quantity > 1 ? 's' : ''} for Minting`
                )}
              </Button>

              {/* Professional Queue Info - moved below mint button */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Professional Queue System</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ Guaranteed completion - jobs persist through network issues</li>
                  <li>✅ Real-time progress tracking with live updates</li>
                  <li>✅ Automatic retries for failed transactions</li>
                  <li>✅ Batch processing optimized for Solana</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Status - Only show when NOT embedded */}
      {!embedded && (
        <MintQueueStatus 
          jobs={jobs} 
          loading={queueLoading} 
          getJobProgress={getJobProgress} 
          collectionName={collection.name}
        />
      )}

    </div>
  );
};