import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Calendar, Hash, Image, TrendingUp, Crown, Rocket, Zap } from "lucide-react";
import { toast } from "sonner";
import type { UserNFT } from "@/hooks/useUserNFTs";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { BoostModal } from "@/components/BoostModal";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { useBoostedListings } from "@/hooks/useBoostedListings";

export default function NFTDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromFavorites = searchParams.get('from') === 'favorites';
  const [nft, setNft] = useState<UserNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const { publicKey } = useSolanaWallet();
  const { boostedListings } = useBoostedListings();
  
  // Navigation context for moving between NFTs
  const navigation = useNavigationContext(id!, 'nft');

  // Find active boost for this NFT
  const currentBoost = boostedListings.find(boost => boost.nft_id === id && boost.is_active);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'god': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'top': return <Rocket className="h-4 w-4 text-blue-500" />;
      default: return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  useEffect(() => {
    const fetchNFT = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('nfts')
          .select(`
            id,
            name,
            symbol,
            description,
            image_url,
            mint_address,
            collection_id,
            owner_address,
            attributes,
            created_at,
            updated_at,
            collections (
              name
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        const transformedNFT: UserNFT = {
          id: data.id,
          name: data.name,
          symbol: data.symbol,
          description: data.description,
          image_url: data.image_url,
          mint_address: data.mint_address,
          collection_id: data.collection_id,
          owner_address: data.owner_address,
          metadata: data.attributes,
          created_at: data.created_at,
          updated_at: data.updated_at,
          collection_name: (data as any).collections?.name
        };

        setNft(transformedNFT);
      } catch (error) {
        console.error('Error fetching NFT:', error);
        toast.error('Failed to load NFT details');
      } finally {
        setLoading(false);
      }
    };

    fetchNFT();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6 w-1/4" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">NFT Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The NFT you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to={navigation.source === 'marketplace' 
                ? "/marketplace" 
                : navigation.source === 'favorites' 
                ? "/profile?tab=favorites" 
                : navigation.source === 'nfts' 
                ? "/profile?tab=nfts" 
                : "/profile?tab=nfts"}>
                Back to {navigation.source === 'marketplace' ? 'Marketplace' : navigation.source === 'favorites' ? 'Favorites' : 'My NFTs'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Helmet>
        <title>{nft.name} - NFT Details</title>
        <meta name="description" content={nft.description || `View details for ${nft.name} NFT`} />
      </Helmet>

      {/* Back Button and Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link to={navigation.source === 'marketplace' 
            ? "/marketplace" 
            : navigation.source === 'favorites' 
            ? "/profile?tab=favorites" 
            : navigation.source === 'nfts' 
            ? "/profile?tab=nfts" 
            : "/profile?tab=nfts"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {navigation.source === 'marketplace' ? 'Marketplace' : navigation.source === 'favorites' ? 'Favorites' : 'My NFTs'}
          </Link>
        </Button>
        
        {/* Navigation arrows */}
        {navigation.canNavigate && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={navigation.navigatePrev}
              disabled={!navigation.hasPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {navigation.currentIndex} of {navigation.totalItems}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={navigation.navigateNext}
              disabled={!navigation.hasNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* NFT Image */}
        <div className="space-y-4">
          <Card>
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={nft.image_url || "/placeholder.svg"}
                alt={nft.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.src !== "/placeholder.svg") {
                    img.src = "/placeholder.svg";
                  }
                }}
              />
            </div>
          </Card>
        </div>

        {/* NFT Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">NFT</Badge>
              {nft.symbol && (
                <Badge variant="outline" className="text-xs">
                  {nft.symbol}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{nft.name}</h1>
            {nft.collection_name && (
              <p className="text-lg text-muted-foreground">
                From collection: <span className="font-medium">{nft.collection_name}</span>
              </p>
            )}
          </div>

          {nft.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{nft.description}</p>
              </CardContent>
            </Card>
          )}

          {/* NFT Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NFT Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Minted</span>
                </div>
                <span className="text-sm font-medium">
                  {new Date(nft.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              {nft.mint_address && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Mint Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {nft.mint_address.slice(0, 8)}...{nft.mint_address.slice(-8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(nft.mint_address!);
                        toast.success('Mint address copied to clipboard');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Owner</span>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {nft.owner_address.slice(0, 8)}...{nft.owner_address.slice(-8)}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Properties */}
          {nft.metadata && Array.isArray(nft.metadata) && nft.metadata.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {nft.metadata.map((attr: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        {attr.trait_type}
                      </div>
                      <div className="font-medium">{attr.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
           )}

          {/* Boost Status/Control Section */}
          {publicKey === nft.owner_address && (
            <Card>
              <CardContent className="p-4">
                {currentBoost ? (
                  // Show current boost status
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Active Boost</h3>
                      <Badge variant="secondary" className="ml-auto">
                        Rank #{currentBoost.bid_rank}
                      </Badge>
                    </div>
                    
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTierIcon(currentBoost.tier)}
                          <span className="font-medium text-sm">
                            {currentBoost.tier.toUpperCase()} TIER
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {Number(currentBoost.bid_amount).toLocaleString()} $ANIME
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        🕐 {getTimeRemaining(currentBoost.end_time)}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Your NFT is currently boosted with premium visibility in the marketplace
                    </p>
                  </div>
                ) : (
                  // Show boost button if no active boost
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setIsBoostModalOpen(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Boost Item
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Boost your NFT for premium visibility in the marketplace
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Boost Modal */}
      {nft && (
        <BoostModal
          isOpen={isBoostModalOpen}
          onClose={() => setIsBoostModalOpen(false)}
          nftId={nft.id}
          nftName={nft.name}
          nftImage={nft.image_url || "/placeholder.svg"}
          onBoostCreated={() => {
            // Optionally refresh data or show success message
            toast.success(`Successfully boosted ${nft.name}!`);
          }}
        />
      )}
    </div>
  );
}