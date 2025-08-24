import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Calendar, Hash, Image, TrendingUp, Crown, Rocket, Zap, Maximize2, ShoppingCart, Gavel, DollarSign, Award } from "lucide-react";
import { toast } from "sonner";
import type { UserNFT } from "@/hooks/useUserNFTs";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { BoostModal } from "@/components/BoostModal";
import { BidModal } from "@/components/BidModal";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { useBoostedListings } from "@/hooks/useBoostedListings";
import { FullscreenNFTViewer } from "@/components/FullscreenNFTViewer";
import { normalizeAttributes } from '@/lib/attributes';
import { truncateAddress } from "@/utils/addressUtils";

interface ExtendedNFT extends UserNFT {
  price?: number;
  is_listed?: boolean;
  currency?: string;
  royalty_percentage?: number;
  creator_display_name?: string;
  owner_display_name?: string;
}

export default function NFTDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isFullscreen = searchParams.get('view') === 'fs';
  const [nft, setNft] = useState<ExtendedNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
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

  // Get edition info from metadata
  const getEditionInfo = () => {
    if (nft?.metadata && typeof nft.metadata === 'object') {
      const metadata = nft.metadata as any;
      if (metadata.edition && metadata.max_supply) {
        return `${metadata.edition}/${metadata.max_supply}`;
      }
      if (metadata.quantity_index && metadata.total_quantity) {
        return `${metadata.quantity_index}/${metadata.total_quantity}`;
      }
    }
    return null;
  };

  const calculateFee = (price: number) => {
    return price * 0.025; // 2.5% fee
  };

  const handleBuyNow = async () => {
    if (!nft?.price || !publicKey) {
      toast.error('Unable to process purchase');
      return;
    }
    
    const totalCost = nft.price + calculateFee(nft.price);
    toast.info(`Processing purchase of ${nft.name} for ${totalCost.toFixed(4)} ${nft.currency || 'SOL'} (includes 2.5% marketplace fee)`);
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || !publicKey) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    
    const bidValue = parseFloat(bidAmount);
    if (bidValue <= 0) {
      toast.error('Bid amount must be greater than 0');
      return;
    }
    
    toast.info(`Placing bid of ${bidValue} ${nft?.currency || 'SOL'} for ${nft?.name}`);
    setIsBidModalOpen(false);
    setBidAmount('');
  };

  useEffect(() => {
    const fetchNFT = async () => {
      if (!id) return;

      try {
        // Fetch NFT with extended data including price, listings, and royalties
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
            creator_address,
            attributes,
            created_at,
            updated_at,
            price,
            is_listed,
            currency,
            collections (
              name,
              royalty_percentage
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        // Fetch user profiles for owner and creator display names
        const addresses = [data.owner_address, data.creator_address].filter(Boolean);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('wallet_address, display_name')
          .in('wallet_address', addresses);

        const ownerProfile = profiles?.find(p => p.wallet_address === data.owner_address);
        const creatorProfile = profiles?.find(p => p.wallet_address === data.creator_address);

        const transformedNFT: ExtendedNFT = {
          id: data.id,
          name: data.name,
          symbol: data.symbol,
          description: data.description,
          image_url: data.image_url,
          mint_address: data.mint_address,
          collection_id: data.collection_id,
          owner_address: data.owner_address,
          creator_address: data.creator_address,
          metadata: data.attributes,
          created_at: data.created_at,
          updated_at: data.updated_at,
          price: data.price,
          is_listed: data.is_listed,
          currency: data.currency || 'SOL',
          royalty_percentage: (data as any).collections?.royalty_percentage,
          collection_name: (data as any).collections?.name,
          owner_display_name: ownerProfile?.display_name,
          creator_display_name: creatorProfile?.display_name
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

  const handleFullscreenToggle = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (isFullscreen) {
      newSearchParams.delete('view');
    } else {
      newSearchParams.set('view', 'fs');
    }
    setSearchParams(newSearchParams);
  };

  const handleFullscreenNavigate = (direction: 'prev' | 'next') => {
    if (navigation.canNavigate) {
      let newIndex: number;
      if (direction === 'prev') {
        newIndex = navigation.currentIndex > 1 ? navigation.currentIndex - 2 : navigation.totalItems - 1;
      } else {
        newIndex = navigation.currentIndex < navigation.totalItems ? navigation.currentIndex : 0;
      }
      
      // Get the navigation items from search params
      const navItems = searchParams.get('nav');
      if (navItems) {
        try {
          const parsedItems = JSON.parse(decodeURIComponent(navItems));
          const targetId = parsedItems[newIndex];
          if (targetId) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('view', 'fs'); // Keep fullscreen mode
            navigate(`/nft/${targetId}?${newParams.toString()}`, { replace: true });
          }
        } catch (error) {
          console.error('Error parsing navigation items:', error);
        }
      }
    }
  };

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
        {/* Left Column - NFT Image and Properties */}
        <div className="space-y-4">
          {/* NFT Image - Sticky */}
          <div className="sticky top-6">
            <Card>
              <div 
                className="aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer group relative"
                onClick={handleFullscreenToggle}
              >
                <img
                  src={nft.image_url || "/placeholder.svg"}
                  alt={nft.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src !== "/placeholder.svg") {
                      img.src = "/placeholder.svg";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Badge variant="secondary" className="bg-black/50 text-white border-white/20">
                    <Maximize2 className="h-3 w-3 mr-1" />
                    View Fullscreen
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Properties */}
          {nft.metadata && (
            (() => {
              const properties = normalizeAttributes(nft.metadata);
              
              if (properties.length > 0) {
                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Properties
                        <Badge variant="outline" className="ml-auto text-xs">
                          {properties.length} traits
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {properties.map((attr, index) => (
                          <div key={index} className="border rounded-md p-2 bg-accent/5 hover:bg-accent/10 transition-colors">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-medium line-clamp-1">
                              {attr.trait_type}
                            </div>
                            <div className="text-sm font-semibold text-foreground break-words line-clamp-2">
                              {attr.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()
          )}
        </div>

        {/* NFT Details */}
        <div className="space-y-6">
          <TooltipProvider>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">NFT</Badge>
                {nft.symbol && (
                  <Badge variant="outline" className="text-xs">
                    {nft.symbol}
                  </Badge>
                )}
                {nft.is_listed && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    Listed for Sale
                  </Badge>
                )}
                {/* Compact Edition Info */}
                {getEditionInfo() && (
                  <Badge variant="outline" className="text-xs">
                    Edition {getEditionInfo()}
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

            {/* Price and Actions */}
            {nft.is_listed && nft.price && (
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Price</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold">{nft.price}</span>
                        <span className="text-lg text-muted-foreground">{nft.currency}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        + {calculateFee(nft.price).toFixed(4)} {nft.currency} marketplace fee (2.5%)
                      </p>
                    </div>
                    {nft.royalty_percentage && nft.royalty_percentage > 0 && (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Royalties</span>
                        </div>
                        <span className="text-sm font-medium">{nft.royalty_percentage}%</span>
                      </div>
                    )}
                  </div>
                  
                  {publicKey !== nft.owner_address && (
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1"
                        onClick={handleBuyNow}
                        size="lg"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Now
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setIsBidModalOpen(true)}
                        size="lg"
                      >
                        <Gavel className="h-4 w-4 mr-2" />
                        Place Bid
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                  <div className="text-right">
                    {nft.owner_display_name ? (
                      <div>
                        <div className="text-sm font-medium">{nft.owner_display_name}</div>
                        <code className="text-xs text-muted-foreground">
                          {truncateAddress(nft.owner_address)}
                        </code>
                      </div>
                    ) : (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {truncateAddress(nft.owner_address)}
                      </code>
                    )}
                  </div>
                </div>

                {nft.creator_address && nft.creator_address !== nft.owner_address && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Creator</span>
                    </div>
                    <div className="text-right">
                      {nft.creator_display_name ? (
                        <div>
                          <div className="text-sm font-medium">{nft.creator_display_name}</div>
                          <code className="text-xs text-muted-foreground">
                            {truncateAddress(nft.creator_address)}
                          </code>
                        </div>
                      ) : (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {truncateAddress(nft.creator_address)}
                        </code>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TooltipProvider>

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
      
      {/* Fullscreen NFT Viewer */}
      {nft && (
        <FullscreenNFTViewer
          isOpen={isFullscreen}
          onClose={() => handleFullscreenToggle()}
          nftId={nft.id}
          nftName={nft.name}
          nftImage={nft.image_url || "/placeholder.svg"}
          collectionName={nft.collection_name}
          onNavigate={handleFullscreenNavigate}
          canNavigate={navigation.canNavigate}
          currentIndex={navigation.currentIndex}
          totalItems={navigation.totalItems}
          price={nft.price}
          currency={nft.currency}
          isListed={nft.is_listed}
          royaltyPercentage={nft.royalty_percentage}
          onBuyNow={handleBuyNow}
          onPlaceBid={() => setIsBidModalOpen(true)}
        />
      )}

      {/* Bid Modal */}
      {nft && (
        <BidModal
          isOpen={isBidModalOpen}
          onClose={() => setIsBidModalOpen(false)}
          nftName={nft.name}
          nftImage={nft.image_url || "/placeholder.svg"}
          currency={nft.currency}
          currentPrice={nft.price}
          onBidPlaced={(amount) => {
            toast.success(`Successfully placed bid of ${amount} ${nft.currency} for ${nft.name}!`);
          }}
        />
      )}
    </div>
  );
}