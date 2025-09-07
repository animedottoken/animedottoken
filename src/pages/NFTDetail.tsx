import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Calendar, Hash, Image, Maximize2, ShoppingCart, Gavel, DollarSign, Award, Edit, Flame, Play } from "lucide-react";
import { toast } from "sonner";
import type { UserNFT } from "@/hooks/useUserNFTs";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { BidModal } from "@/components/BidModal";
import { useSolanaWallet } from "@/contexts/MockSolanaWalletContext";
import { FullscreenNFTViewer } from "@/components/FullscreenNFTViewer";
import { EditNFTDialog } from "@/components/EditNFTDialog";
import { normalizeAttributes } from '@/lib/attributes';
import { detectMediaKind, getMediaTypeDisplay } from '@/lib/media';
import { truncateAddress } from "@/utils/addressUtils";
import { PriceTag } from '@/components/ui/price-tag';

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
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { publicKey, connect } = useSolanaWallet();
  
  // Navigation context for moving between NFTs
  const navigation = useNavigationContext(id!, 'nft');
  
  // Add fallback logic to rebuild navigation context if missing
  useEffect(() => {
    const buildFallbackNavigation = async () => {
      if (navigation.canNavigate || !nft?.collection_id) return;
      
      try {
        // Get all NFTs from the same collection as fallback navigation
        const { data: allNfts } = await supabase.rpc('get_nfts_public');
        const collectionNFTs = (allNfts || [])
          .filter((n: any) => n.collection_id === nft.collection_id)
          .map((n: any) => n.id);
        
        if (collectionNFTs.length > 1) {
          // Import setNavContext dynamically to avoid circular imports
          const { setNavContext } = await import('@/lib/navContext');
          setNavContext({
            type: 'nft',
            items: collectionNFTs,
            source: 'collection',
            tab: 'nfts'
          });
        }
      } catch (error) {
        console.error('Failed to build fallback navigation:', error);
      }
    };
    
    buildFallbackNavigation();
  }, [navigation.canNavigate, nft?.collection_id]);

  // Handle NFT burning
  const handleBurnNFT = async (nftId: string, mintAddress: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('burn-nft', {
        body: {
          nft_id: nftId,
          wallet_address: publicKey
        }
      });
      
      if (data?.success) {
        toast.success('NFT burned successfully');
        // Navigate back to profile or collection
        const fromParam = searchParams.get('from');
        if (fromParam === 'nfts') {
          navigate('/profile?tab=nfts');
        } else if (fromParam === 'collection' && nft?.collection_id) {
          navigate(`/collection/${nft.collection_id}`);
        } else {
          navigate('/profile');
        }
      } else {
        toast.error(data?.error || 'Failed to burn NFT');
      }
    } catch (error) {
      console.error('Error burning NFT:', error);
      toast.error('Failed to burn NFT');
    }
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


  const handleBuyNow = async () => {
    if (!nft?.price || !publicKey) {
      toast.error('Unable to process purchase');
      return;
    }
    
    toast.info(`Processing purchase of ${nft.name} for ${nft.price.toFixed(4)} ${nft.currency || 'SOL'}`);
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

  const fetchNFT = useCallback(async () => {
    if (!id) return;

    try {
      // Fetch NFT via secure public RPC
      const { data: allNfts, error: nftError } = await supabase.rpc('get_nfts_public');
      if (nftError) throw nftError;
      const pub = (allNfts || []).find((n: any) => n.id === id);
      if (!pub) throw new Error('NFT not found');

      // Fetch collection details via masked public RPC
      const { data: allCollections } = await supabase.rpc('get_collections_public_masked');
      const collection = (allCollections || []).find((c: any) => c.id === pub.collection_id);

      // Fetch display names via public profiles RPC (match by masked address)
      const { data: profiles } = await supabase.rpc('get_profiles_public');
      const mask = (addr: string) => `${addr.slice(0,4)}...${addr.slice(-4)}`;
      const ownerProfile = (profiles || []).find((p: any) => mask(p.wallet_address) === pub.owner_address_masked);
      const creatorProfile = (profiles || []).find((p: any) => mask(p.wallet_address) === pub.creator_address_masked);

      const transformedNFT: ExtendedNFT = {
        id: pub.id,
        name: pub.name,
        symbol: pub.symbol,
        description: pub.description,
        image_url: pub.image_url,
        mint_address: pub.mint_address,
        collection_id: pub.collection_id,
        owner_address: pub.owner_address_masked,
        creator_address: pub.creator_address_masked,
        metadata: pub.attributes,
        created_at: pub.created_at,
        updated_at: pub.updated_at,
        price: pub.price,
        is_listed: pub.is_listed,
        currency: pub.currency || 'SOL',
        royalty_percentage: collection?.royalty_percentage,
        collection_name: collection?.name,
        owner_display_name: ownerProfile?.display_name,
        creator_display_name: creatorProfile?.display_name
      } as any;

      setNft(transformedNFT);
    } catch (error) {
      console.error('Error fetching NFT:', error);
      toast.error('Failed to load NFT details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNFT();
    // Reset video error state when NFT changes
    setVideoError(false);
  }, [fetchNFT]);

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
      // Use the navigation hook's built-in navigation functions
      if (direction === 'prev') {
        navigation.navigatePrev();
      } else {
        navigation.navigateNext();
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
              <Link to={searchParams.get('from') === 'collection' || navigation.source === 'collection'
                ? nft?.collection_id 
                  ? `/collection/${nft.collection_id}`
                  : "/profile"
                : navigation.source === 'marketplace' 
                ? "/marketplace" 
                : navigation.source === 'favorites' 
                ? "/profile?tab=favorites" 
                : navigation.source === 'nfts' 
                ? "/profile" 
                : "/profile"}>
                Back to {searchParams.get('from') === 'collection' || navigation.source === 'collection'
                  ? 'Collection' 
                  : navigation.source === 'marketplace' 
                  ? 'Marketplace' 
                  : navigation.source === 'favorites' 
                  ? 'Favorites' 
                  : 'Profile'}
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
          <Link to={searchParams.get('from') === 'collection' || navigation.source === 'collection'
            ? nft?.collection_id 
              ? `/collection/${nft.collection_id}`
              : "/profile"
            : navigation.source === 'marketplace' 
            ? `/marketplace?tab=${searchParams.get('tab') || 'nfts'}` 
            : navigation.source === 'favorites' 
            ? "/profile?tab=favorites" 
            : navigation.source === 'nfts' 
            ? "/profile" 
            : "/profile"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {searchParams.get('from') === 'collection' || navigation.source === 'collection'
              ? 'Collection' 
              : navigation.source === 'marketplace' 
              ? 'Marketplace' 
              : navigation.source === 'favorites' 
              ? 'Favorites' 
              : 'Profile'}
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
          {/* NFT Image */}
          <div key={nft.id}>
            <Card>
              <div 
                className="aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer group relative"
                onClick={handleFullscreenToggle}
              >
                {/* Render different media types */}
                {(() => {
                  const mediaKind = detectMediaKind(nft.image_url, nft.metadata?.animation_url, nft.metadata?.media_type);
                  const animationUrl = nft.metadata?.animation_url;
                  
                  if (videoError || !animationUrl) {
                    // Fallback to static image
                    return (
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
                    );
                  }
                  
                  if (mediaKind === 'video') {
                    return (
                      <div className="w-full h-full relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          src={animationUrl}
                          poster={nft.image_url || "/placeholder.svg"}
                          className="w-full h-full object-cover"
                          controls={false}
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          onError={() => {
                            console.error('Video load error:', animationUrl, 'falling back to image');
                            setVideoError(true);
                          }}
                        />
                        <div 
                          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer hover:bg-black/30 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (videoRef.current) {
                              videoRef.current.play().then(() => {
                                videoRef.current!.controls = true;
                                e.currentTarget.style.display = 'none';
                              }).catch(console.error);
                            }
                          }}
                        >
                          <div className="bg-white/90 rounded-full p-3 hover:bg-white transition-colors">
                            <Play className="h-6 w-6 text-black" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    );
                  } else if (mediaKind === 'audio') {
                    return (
                      <div className="w-full h-full relative">
                        {nft.image_url && (
                          <img
                            src={nft.image_url}
                            alt={nft.name}
                            className="w-full h-full object-cover absolute inset-0"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="bg-white/90 rounded-lg p-4 max-w-sm w-full mx-4">
                            <audio controls className="w-full">
                              <source src={animationUrl} type={nft.metadata?.media_type || 'audio/mpeg'} />
                              Your browser does not support audio playback.
                            </audio>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (mediaKind === '3d') {
                    return (
                      <div className="w-full h-full relative">
                        {nft.image_url && (
                          <img
                            src={nft.image_url}
                            alt={nft.name}
                            className="w-full h-full object-cover absolute inset-0"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="text-center text-white">
                            <Maximize2 className="h-16 w-16 mx-auto mb-4" />
                            <p className="text-sm font-medium">3D Model</p>
                            <p className="text-xs opacity-80">Click to view in fullscreen</p>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (mediaKind === 'animated') {
                    // Show animated GIF or WebP directly
                    return (
                      <img
                        src={animationUrl}
                        alt={nft.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => {
                          console.error('Animated image load error, falling back to static image');
                          setVideoError(true);
                        }}
                      />
                    );
                  } else {
                    // Static image fallback
                    return (
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
                    );
                  }
                })()}
                {false && ( // This replaces the old fallback
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
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs cursor-help" title="Non-Fungible Token - unique digital asset">NFT</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Non-Fungible Token - This is a unique digital asset stored on the blockchain</p>
                  </TooltipContent>
                </Tooltip>
                {nft.symbol && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs cursor-help" title={`Collection symbol: ${nft.symbol}`}>
                        {nft.symbol}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Collection Symbol - A short identifier for the NFT collection this item belongs to</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {nft.is_listed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="default" className="text-xs bg-green-600 cursor-help" title="Available for Purchase">
                        Listed
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Available for Purchase - This NFT is currently listed on the marketplace and can be bought</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{nft.name}</h1>
              {nft.collection_name && (
                <p className="text-lg text-muted-foreground">
                  From collection: <span className="font-medium">{nft.collection_name}</span>
                </p>
              )}
              
              {/* Owner Action Buttons */}
              {publicKey && nft.owner_address === publicKey && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit NFT
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      // Add burn functionality
                      if (!nft.mint_address) {
                        toast.error('Mint address missing for this NFT');
                        return;
                      }
                      
                      // Create confirmation dialog
                      const confirmed = window.confirm(
                        `Are you sure you want to burn "${nft.name}"? This action cannot be undone and will permanently destroy the NFT.`
                      );
                      
                      if (confirmed) {
                        // Call burn function
                        handleBurnNFT(nft.id, nft.mint_address);
                      }
                    }}
                  >
                    <Flame className="w-4 h-4 mr-1" />
                    Burn NFT
                  </Button>
                </div>
              )}
            </div>

            {/* Price and Actions */}
            {nft.is_listed && nft.price && (
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <PriceTag amount={nft.price} currency={nft.currency} size="lg" />
                      {getEditionInfo() && (
                        <div className="flex items-center gap-1 mt-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Edition {getEditionInfo()}</span>
                        </div>
                      )}
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
                  
                  {!publicKey ? (
                    // Not connected - show connection prompt
                    <div className="text-center p-6 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground mb-4">
                        To buy this NFT, you need to connect your wallet first.
                      </p>
                      <Button 
                        onClick={() => connect()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Connect Wallet to Buy
                      </Button>
                    </div>
                  ) : publicKey === nft.owner_address ? (
                    // Owner viewing their own NFT
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground">
                        You own this NFT
                      </p>
                    </div>
                  ) : (
                    // Connected user can buy
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

                {/* Media Information */}
                {(() => {
                  const mediaKind = detectMediaKind(nft.image_url, nft.metadata?.animation_url, nft.metadata?.media_type);
                  const mediaTypeDisplay = getMediaTypeDisplay(mediaKind);
                  const mediaUrl = nft.metadata?.animation_url || nft.image_url;
                  const fileExtension = mediaUrl ? mediaUrl.split('.').pop()?.toUpperCase() : null;
                  const mimeType = nft.metadata?.media_type;
                  
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Media</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {mediaTypeDisplay && (
                            <Badge variant="outline" className="text-xs">
                              {mediaTypeDisplay.label}
                            </Badge>
                          )}
                          {fileExtension && (
                            <Badge variant="secondary" className="text-xs">
                              {fileExtension}
                            </Badge>
                          )}
                        </div>
                        {mimeType && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {mimeType}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

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

        </div>
      </div>
      
      {/* Fullscreen NFT Viewer */}
      {nft && (
        <FullscreenNFTViewer
          isOpen={isFullscreen}
          onClose={handleFullscreenToggle}
          nftImage={nft.image_url}
          nftName={nft.name}
          nftId={nft.id}
          collectionName={nft.collection_name}
          price={nft.price}
          currency={nft.currency || 'SOL'}
          isListed={nft.is_listed}
          isOwner={publicKey === nft.owner_address}
          canNavigate={navigation.canNavigate}
          hasNext={navigation.hasNext}
          hasPrev={navigation.hasPrev}
          currentIndex={navigation.currentIndex}
          totalItems={navigation.totalItems}
          onNext={() => handleFullscreenNavigate('next')}
          onPrev={() => handleFullscreenNavigate('prev')}
          onBuyNow={handleBuyNow}
          onPlaceBid={() => setIsBidModalOpen(true)}
          mediaUrl={nft.metadata?.animation_url}
          mediaType={nft.metadata?.media_type}
          coverImageUrl={nft.image_url}
        />
      )}

      {/* Bid Modal */}
      {nft && (
        <BidModal
          isOpen={isBidModalOpen}
          onClose={() => setIsBidModalOpen(false)}
          nftId={nft.id}
          nftName={nft.name}
          nftImage={nft.image_url || "/placeholder.svg"}
          currency={nft.currency}
          currentPrice={nft.price}
          onBidPlaced={(amount) => {
            toast.success(`Successfully placed bid of ${amount} ${nft.currency} for ${nft.name}!`);
          }}
        />
      )}

      {/* Edit NFT Dialog */}
      {nft && (
        <EditNFTDialog
          nft={nft}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUpdate={fetchNFT}
        />
      )}
    </div>
  );
}