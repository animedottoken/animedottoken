import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Zap, Shield } from 'lucide-react';
import { useMinting } from '@/hooks/useMinting';
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

export const MintingInterface = ({ collectionId = 'sample-collection' }: MintingInterfaceProps) => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const { isMinting, mintResult, mintNFT } = useMinting();
  const { connected } = useSolanaWallet();

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (data) {
        setCollection(data);
      } else {
        // Create sample collection if none exists
        await createSampleCollection();
      }
    } catch (error) {
      console.error('Error loading collection:', error);
      await createSampleCollection();
    } finally {
      setLoading(false);
    }
  };

  const createSampleCollection = async () => {
    try {
      console.log('Creating sample collection...');
      const sampleCollection = {
        name: 'ANIME ARMY Genesis',
        symbol: 'AAGEN',
        description: 'The first collection of ANIME ARMY NFTs featuring unique anime-style characters with special powers and abilities.',
        image_url: '/images/og-anime.jpg',
        max_supply: 10000,
        items_available: 10000,
        items_redeemed: 2847,
        mint_price: 0.1,
        creator_address: 'ANiMeArMyCreator1234567890',
        treasury_wallet: 'ANiMeArMyTreasury1234567890',
        royalty_percentage: 5,
        is_active: true,
        is_live: true,
        whitelist_enabled: false
      };

      const { data, error } = await supabase
        .from('collections')
        .insert(sampleCollection)
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
        mint_price: 0.1,
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
    if (!collection) return;
    await mintNFT(collection.id);
  };

  const mintProgress = collection ? (collection.items_redeemed / collection.max_supply) * 100 : 0;
  const isLive = collection?.is_live && connected;
  const isSoldOut = collection ? collection.items_redeemed >= collection.max_supply : false;

  if (loading) {
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
    <div className="w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              🔥 Live Mint
            </CardTitle>
            <div className="flex gap-2">
              {isLive && <Badge className="bg-green-500 text-white">LIVE</Badge>}
              {isSoldOut && <Badge variant="destructive">SOLD OUT</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <img 
                src={collection.image_url} 
                alt={collection.name}
                className="w-full h-64 object-cover rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <div className="font-bold text-lg">{collection.mint_price} SOL</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Supply:</span>
                  <div className="font-bold">{collection.max_supply.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
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

              {mintResult && (
                <div className={`p-4 rounded-lg border ${mintResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {mintResult.success ? (
                    <div>
                      <p className="font-semibold text-green-800">✅ Mint Successful!</p>
                      <p className="text-sm text-green-600 mt-1">
                        NFT Address: {mintResult.nftAddress?.slice(0, 8)}...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-red-800">❌ Mint Failed</p>
                      <p className="text-sm text-red-600 mt-1">{mintResult.error}</p>
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={handleMint}
                disabled={!isLive || isMinting || isSoldOut}
                className="w-full py-6 text-lg font-semibold"
                size="lg"
              >
                {isMinting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Minting...
                  </>
                ) : isSoldOut ? (
                  'SOLD OUT'
                ) : !connected ? (
                  'Connect Wallet to Mint'
                ) : (
                  `Mint for ${collection.mint_price} SOL`
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <div className="text-sm text-muted-foreground">Go Live</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">Instant</div>
              <div className="text-sm text-muted-foreground">Reveal</div>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};