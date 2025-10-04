import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Settings, Trash2, ChevronDown, ChevronUp, FileText, Maximize2, Play } from "lucide-react";
import { toast } from "sonner";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import type { UserNFT } from "@/hooks/useUserNFTs";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { BidModal } from "@/components/BidModal";
import { useSolanaWallet } from "@/contexts/MockSolanaWalletContext";
import { FullscreenNFTViewer } from "@/components/FullscreenNFTViewer";
import { EditNFTDialog } from "@/components/EditNFTDialog";
import { UserProfileDisplay } from "@/components/UserProfileDisplay";
import { detectMediaKind, getMediaTypeDisplay } from '@/lib/media';
import { truncateAddress } from "@/utils/addressUtils";
import { normalizeAttributes } from '@/lib/attributes';

interface ExtendedNFT extends UserNFT {
  price?: number;
  is_listed?: boolean;
  currency?: string;
  royalty_percentage?: number;
  creator_display_name?: string;
  owner_display_name?: string;
  views?: number;
  network?: string;
  metadata_uri?: string;
  // Collection details
  collection_name?: string;
  collection_symbol?: string;
  collection_mint_price?: number | null;
  collection_max_supply?: number | null;
  collection_items_available?: number | null;
  collection_items_redeemed?: number | null;
  collection_verified?: boolean;
}

export default function NFTDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState<ExtendedNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [burning, setBurning] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { publicKey, connect } = useSolanaWallet();
  
  // Navigation context for moving between NFTs
  const navigation = useNavigationContext(id!, 'nft');
  
  // Handle NFT burning
  const handleBurnNFT = async () => {
    if (!nft) return;
    
    const confirmBurn = window.confirm(
      `Are you sure you want to burn "${nft.name}"? This action cannot be undone and will permanently destroy the NFT.`
    );
    
    if (!confirmBurn) return;
    
    setBurning(true);
    try {
      const { data, error } = await supabase.functions.invoke('burn-nft', {
        body: {
          nft_id: nft.id,
          wallet_address: publicKey
        }
      });
      
      if (data?.success) {
        toast.success('NFT burned successfully! 🔥');
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
    } finally {
      setBurning(false);
    }
  };

  const fetchNFT = useCallback(async () => {
    if (!id) return;

    try {
      const { data: allNfts, error: nftError } = await supabase.rpc('get_nfts_public');
      if (nftError) throw nftError;
      const pub = (allNfts || []).find((n: any) => n.id === id);
      if (!pub) throw new Error('NFT not found');

      const { data: allCollections } = await supabase.rpc('get_collections_public_masked');
      const collection = (allCollections || []).find((c: any) => c.id === pub.collection_id);

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
        network: 'mainnet',
        metadata_uri: pub.metadata_uri || undefined,
        royalty_percentage: collection?.royalty_percentage,
        collection_name: collection?.name,
        collection_symbol: collection?.symbol ?? null,
        collection_mint_price: collection?.mint_price ?? null,
        collection_max_supply: collection?.max_supply ?? null,
        collection_items_available: collection?.items_available ?? null,
        collection_items_redeemed: collection?.items_redeemed ?? null,
        collection_verified: collection?.verified,
        owner_display_name: ownerProfile?.display_name,
        creator_display_name: creatorProfile?.display_name,
        views: pub.views || 0
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
    setVideoError(false);
  }, [fetchNFT]);

  const handleFullscreenToggle = () => {
    setIsFullscreenOpen(!isFullscreenOpen);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8" />
            <div className="h-64 bg-muted rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-muted rounded" />
              <div className="h-48 bg-muted rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!nft) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-4">NFT Not Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              The NFT you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/profile')}>
              Back to Profile
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const maskAddr = (addr: string) => `${addr.slice(0,4)}...${addr.slice(-4)}`;
  const isOwner = publicKey ? maskAddr(publicKey) === nft.owner_address : false;

  return (
    <>
      <Helmet>
        <title>{nft.name} - NFT Details</title>
        <meta name="description" content={nft.description || `View details for ${nft.name} NFT`} />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => {
              const backUrl = navigation.source === 'collection' && nft.collection_id
                ? `/collection/${nft.collection_id}`
                : navigation.source === 'marketplace'
                ? `/marketplace?tab=${searchParams.get('tab') || 'nfts'}`
                : navigation.source === 'favorites'
                ? '/profile?tab=favorites'
                : '/profile';
              navigate(backUrl);
            }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {navigation.source === 'collection' ? 'Collection' : navigation.source === 'marketplace' ? 'Marketplace' : navigation.source === 'favorites' ? 'Favorites' : 'Profile'}
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

          {/* Main Content - Small Image + Main Details */}
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 mb-8">
            {/* Left - Small 1:1 NFT Image */}
            <div>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="aspect-square overflow-hidden bg-muted cursor-pointer group relative"
                    onClick={handleFullscreenToggle}
                  >
                    {(() => {
                      const mediaKind = detectMediaKind(nft.image_url, nft.metadata?.animation_url, nft.metadata?.media_type);
                      const animationUrl = nft.metadata?.animation_url;
                      
                      if (videoError || !animationUrl) {
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
                          <div className="w-full h-full relative bg-black">
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
                              onError={() => setVideoError(true)}
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
                      }
                      
                      return (
                        <img
                          src={nft.image_url || "/placeholder.svg"}
                          alt={nft.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      );
                    })()}
                    
                    {/* Fullscreen overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                      <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right - Main NFT Info */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Name and Badges */}
                <div>
                  <h1 className="text-3xl font-bold mb-3">{nft.name}</h1>
                  <div className="flex flex-wrap gap-2">
                    {nft.is_listed && (
                      <Badge variant="default" className="bg-green-500">Listed</Badge>
                    )}
                    {nft.collection_name && (
                      <Badge variant="outline">{nft.collection_name}</Badge>
                    )}
                    {nft.collection_verified && (
                      <Badge variant="secondary" className="bg-blue-500 text-white">
                        Verified Collection
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Creator */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Creator</div>
                  <UserProfileDisplay 
                    walletAddress={nft.creator_address} 
                    size="sm"
                    showRankBadge={false}
                  />
                </div>

                <Separator />

                {/* Owner */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Owner</div>
                  <UserProfileDisplay 
                    walletAddress={nft.owner_address} 
                    size="sm"
                    showRankBadge={false}
                  />
                </div>

                <Separator />

                {/* Minted */}
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Minted</div>
                  <div className="text-sm">
                    {new Date(nft.created_at).toLocaleDateString()}
                  </div>
                </div>

                <Separator />

                {/* PRICE - Prominent */}
                <div>
                  <div className="text-sm text-primary mb-1">Price</div>
                  <div className="text-2xl font-bold">
                    {nft.price ? `${nft.price} ${nft.currency || 'SOL'}` : 'Not for sale'}
                  </div>
                  {nft.royalty_percentage !== undefined && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {nft.royalty_percentage}% creator royalty
                    </div>
                  )}
                  
                  {/* BUY / BID BUTTONS HERE */}
                  {nft.is_listed && nft.price && !isOwner && (
                    <div className="mt-4">
                      {!publicKey ? (
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-3">
                            Connect your wallet to purchase this NFT
                          </p>
                          <SolanaWalletButton />
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <Button className="flex-1" size="lg">
                            Buy Now
                          </Button>
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => setIsBidModalOpen(true)}
                          >
                            Place Bid
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NFT Details Card (Collections Style) */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  NFT Details
                </div>
                {isOwner && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Settings
                    {isSettingsExpanded ? (
                      <ChevronUp className="w-3 h-3 ml-1" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete information about this NFT. {isOwner && "Click \"Settings\" to manage."}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Owner Settings (Collapsible) */}
              {isOwner && isSettingsExpanded && (
                <div className="mb-6 pb-6 border-b space-y-3">
                  <h4 className="font-semibold mb-3">Owner Actions</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="w-full"
                  >
                    Edit NFT
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBurnNFT}
                    disabled={burning}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {burning ? 'Burning...' : 'Burn NFT'}
                  </Button>
                </div>
              )}

              {/* Legend */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-normal mb-3">Data Storage Legend</h4>
                <div className="flex flex-wrap gap-6 overflow-x-auto">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                    <Badge variant="onchain">On-Chain</Badge>
                    <span>Stored permanently on blockchain</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                    <Badge variant="offchain">Off-Chain</Badge>
                    <span>Stored in app database</span>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h4 className="font-semibold mb-3">Basic Information</h4>
                <div className="space-y-3">
                  {/* Name */}
                  <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Name</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {nft.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                      {isOwner && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsEditDialogOpen(true)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Symbol */}
                  {nft.symbol && (
                    <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Symbol</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {nft.symbol}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                        {isOwner && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsEditDialogOpen(true)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {nft.description && (
                    <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Description</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {nft.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                        {isOwner && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsEditDialogOpen(true)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Media Type */}
                  {(() => {
                    const mediaKind = detectMediaKind(nft.image_url, nft.metadata?.animation_url, nft.metadata?.media_type);
                    const mediaDisplay = getMediaTypeDisplay(mediaKind);
                    return (
                      <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium">Media Type</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {mediaDisplay?.label || 'Static Image'}
                          </div>
                        </div>
                        <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                      </div>
                    );
                  })()}

                  {/* Category */}
                  {nft.metadata?.category && (
                    <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Category</div>
                        <div className="text-sm text-muted-foreground mt-1 capitalize">
                          {nft.metadata.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                        {isOwner && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsEditDialogOpen(true)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Listing & Market Information */}
              <div>
                <h4 className="font-semibold mb-3">Listing & Market Information</h4>
                <div className="space-y-3">
                  {/* Listing Status */}
                  <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Listing Status</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {nft.is_listed ? '✓ Listed for sale' : '✗ Not listed'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                      {isOwner && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsEditDialogOpen(true)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  {nft.price && (
                    <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Price</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {nft.price} {nft.currency || 'SOL'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                        {isOwner && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsEditDialogOpen(true)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Currency */}
                  <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Currency</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {nft.currency || 'SOL'}
                      </div>
                    </div>
                    <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                  </div>

                  {/* Royalties */}
                  {nft.royalty_percentage !== undefined && (
                    <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Creator Royalties</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {nft.royalty_percentage}% on secondary sales
                        </div>
                      </div>
                      <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                    </div>
                  )}

                  {/* Views */}
                  <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Views</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {nft.views || 0} views
                      </div>
                    </div>
                    <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                  </div>
                </div>
              </div>

              {/* On-Chain Data */}
              <div>
                <h4 className="font-semibold mb-3">On-Chain Data</h4>
                <div className="space-y-3">
                  <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Mint Address</div>
                      <div className="text-sm text-muted-foreground break-all mt-1">
                        {nft.mint_address}
                      </div>
                    </div>
                    <Badge variant="onchain" className="ml-2">On-Chain</Badge>
                  </div>

                  {nft.metadata_uri && (
                    <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Metadata URI</div>
                        <div className="text-sm text-muted-foreground break-all mt-1">
                          <a
                            href={nft.metadata_uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            View Metadata <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <Badge variant="onchain" className="ml-2">On-Chain</Badge>
                    </div>
                  )}

                  {nft.network && (
                    <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Network</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {nft.network}
                        </div>
                      </div>
                      <Badge variant="onchain" className="ml-2">On-Chain</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h4 className="font-semibold mb-3">Timestamps</h4>
                <div className="space-y-3">
                  {/* Created At */}
                  <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Created At</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(nft.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                  </div>

                  {/* Updated At */}
                  <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Last Updated</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(nft.updated_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="offchain" className="ml-2">Off-Chain</Badge>
                  </div>
                </div>
              </div>

              {/* Collection Details */}
              {nft.collection_id && nft.collection_name && (
                <div>
                  <h4 className="font-semibold mb-3">Collection Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Collection</div>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm text-primary hover:underline mt-1"
                          onClick={() => navigate(`/collection/${nft.collection_id}`)}
                        >
                          {nft.collection_name}
                        </Button>
                      </div>
                      <Badge variant="outline" className="ml-2">Collection</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Properties (Custom Attributes Only) */}
              {(() => {
                const customProperties = normalizeAttributes(nft.metadata);
                return customProperties.length > 0 ? (
                  <div>
                    <h4 className="font-semibold mb-3">Properties</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {customProperties.map((attr, index) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground uppercase">{attr.trait_type}</div>
                          <div className="text-sm font-medium mt-1">{attr.value}</div>
                        </div>
                      ))}
                    </div>
                    {isOwner && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-3"
                        onClick={() => setIsEditDialogOpen(true)}
                      >
                        Edit Properties
                      </Button>
                    )}
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Fullscreen Viewer */}
      {isFullscreenOpen && nft && (
        <FullscreenNFTViewer
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
          nftImage={nft.image_url || '/placeholder.svg'}
          nftName={nft.name}
          nftId={nft.id}
          collectionName={nft.collection_name}
          price={nft.price}
          currency={nft.currency || 'SOL'}
          isListed={nft.is_listed}
          isOwner={isOwner}
          canNavigate={navigation.canNavigate}
          hasNext={navigation.hasNext}
          hasPrev={navigation.hasPrev}
          currentIndex={navigation.currentIndex}
          totalItems={navigation.totalItems}
          onNext={navigation.navigateNext}
          onPrev={navigation.navigatePrev}
          mediaUrl={nft.metadata?.animation_url}
          mediaType={nft.metadata?.media_type}
          coverImageUrl={nft.image_url}
        />
      )}

      {/* Bid Modal */}
      <BidModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        nftId={nft.id}
        nftName={nft.name}
        nftImage={nft.image_url || '/placeholder.svg'}
        currentPrice={nft.price}
        currency={nft.currency || 'SOL'}
        onBidPlaced={(amount) => {
          toast.success(`Bid of ${amount} ${nft.currency || 'SOL'} placed for ${nft.name}`);
        }}
      />

      {/* Edit Dialog */}
      {isOwner && nft && (
        <EditNFTDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          nft={nft}
          onUpdate={() => {
            fetchNFT();
            toast.success('NFT updated successfully');
          }}
        />
      )}
    </>
  );
}
