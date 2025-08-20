import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Users, Zap, Shield, Plus, Minus } from 'lucide-react';
import { useMintQueue } from '@/hooks/useMintQueue';
import { MintQueueStatus } from '@/components/MintQueueStatus';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';

interface Collection {
  id: string;
  name: string;
  description: string;
  image_url: string;
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

interface MintingInterfaceProps {
  collectionId?: string;
}

export const MintingInterface = ({ collectionId = '123e4567-e89b-12d3-a456-426614174000' }: MintingInterfaceProps) => {
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
      } else {
        console.log('No collection found, creating sample collection');
        // Create sample collection if none exists
        await createSampleCollection();
      }
    } catch (error) {
      console.error('Error loading collection:', error);
      await createSampleCollection();
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
    
    const result = await createMintJob(collection.id, quantity);
    if (result.success) {
      setQuantity(1); // Reset quantity after successful job creation
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
    <div className="w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              🔥 {collection.name} - Collection NFTs
            </CardTitle>
            <div className="flex gap-2">
              {isLive && <Badge className="bg-green-500 text-white">LIVE</Badge>}
              {isSoldOut && <Badge variant="destructive">SOLD OUT</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <img 
                src={collection.image_url} 
                alt={collection.name}
                className="w-full h-64 object-cover rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Price per NFT:</span>
                  <div className="font-bold text-lg text-green-600">
                    {collection.mint_price === 0 ? 'FREE' : `${collection.mint_price} SOL`}
                  </div>
                  {collection.mint_price === 0 && (
                    <div className="text-xs text-muted-foreground">+ gas fees (~$0.01 each)</div>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Supply:</span>
                  <div className="font-bold">{collection.max_supply.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{remainingSupply.toLocaleString()} remaining</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">{collection.name}</h3>
                <p className="text-muted-foreground text-sm">{collection.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Minted</span>
                  <span>{collection.items_redeemed.toLocaleString()} / {collection.max_supply.toLocaleString()}</span>
                </div>
                <Progress value={mintProgress} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {(100 - mintProgress).toFixed(1)}% remaining
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantity to Mint
                </Label>
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
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={incrementQuantity}
                    disabled={quantity >= maxPerJob || creating}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Max: {maxPerJob}
                  </div>
                </div>
                
                {/* Total Cost */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Total Cost:</span>
                  <span className="font-bold text-lg">
                    {totalCost === 0 ? 'FREE' : `${totalCost.toFixed(4)} SOL`}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleMint}
                disabled={!isLive || creating || isSoldOut || quantity > remainingSupply}
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
                ) : quantity > remainingSupply ? (
                  `Only ${remainingSupply} Left`
                ) : (
                  `Queue ${quantity} NFT${quantity > 1 ? 's' : ''} for Minting`
                )}
              </Button>

              {/* Professional Queue Info */}
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

      {/* Queue Status */}
      <MintQueueStatus 
        jobs={jobs} 
        loading={queueLoading} 
        getJobProgress={getJobProgress} 
        collectionName={collection.name}
      />

      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">{collection.max_supply.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Supply</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">Live Now</div>
              <div className="text-sm text-muted-foreground">Mint Status</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">Queue System</div>
              <div className="text-sm text-muted-foreground">Professional</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">5%</div>
              <div className="text-sm text-muted-foreground">Royalties</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="font-semibold">Features & Benefits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Badge variant="secondary" className="justify-start p-2">✨ Unique Anime Art</Badge>
              <Badge variant="secondary" className="justify-start p-2">🎮 Gaming Integration</Badge>
              <Badge variant="secondary" className="justify-start p-2">💎 Rare Traits</Badge>
              <Badge variant="secondary" className="justify-start p-2">🏆 Community Access</Badge>
              <Badge variant="secondary" className="justify-start p-2">⚡ Queue Processing</Badge>
              <Badge variant="secondary" className="justify-start p-2">🔄 Auto Retry Logic</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};