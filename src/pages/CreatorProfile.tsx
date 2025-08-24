import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, ArrowLeft, ChevronLeft, ChevronRight, Info, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorFollows } from "@/hooks/useCreatorFollows";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { useNFTLikes } from "@/hooks/useNFTLikes";
import { useCollectionLikes } from "@/hooks/useCollectionLikes";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageLazyLoad } from "@/components/ImageLazyLoad";
import profileBanner from '@/assets/profile-banner.jpg';

interface Creator {
  wallet_address: string;
  nickname?: string;
  bio?: string;
  profile_image_url?: string;
  banner_image_url?: string;
  trade_count: number;
  profile_rank: string;
  verified: boolean;
  follower_count: number;
  nft_likes_count: number;
  created_nfts: number;
}

interface NFT {
  id: string;
  name: string;
  image_url: string;
  price?: number;
  collection_address?: string;
  collection_name?: string;
  likes_count: number;
}

interface Collection {
  id: string;
  name: string;
  image_url: string;
  description?: string;
  items_total: number;
  items_redeemed: number;
  verified: boolean;
}

// Helper functions matching Profile.tsx
const getRankBadge = (rank: string) => {
  switch (rank) {
    case 'DIAMOND': return { icon: '🏆', text: 'Diamond' };
    case 'GOLD': return { icon: '🥇', text: 'Gold' };
    case 'SILVER': return { icon: '🥈', text: 'Silver' };
    case 'BRONZE': return { icon: '🥉', text: 'Bronze' };
    default: return { icon: '🌟', text: 'Starter' };
  }
};

export default function CreatorProfile() {
  const { wallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { publicKey } = useSolanaWallet();
  const { isFollowing, toggleFollow, loading: followLoading } = useCreatorFollows();
  const { isLiked, toggleLike, loading: nftLikeLoading } = useNFTLikes();
  const { isLiked: isCollectionLiked, toggleLike: toggleCollectionLike } = useCollectionLikes();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorNFTs, setCreatorNFTs] = useState<NFT[]>([]);
  const [creatorCollections, setCreatorCollections] = useState<Collection[]>([]);
  const [likedNFTs, setLikedNFTs] = useState<NFT[]>([]);
  const [likedCollections, setLikedCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("collections");

  // Navigation state
  const from = searchParams.get('from');
  const navParam = searchParams.get('nav');
  const navCreators = navParam ? JSON.parse(decodeURIComponent(navParam)) : [];
  const currentIndex = wallet ? navCreators.indexOf(wallet) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < navCreators.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && hasPrevious) {
        handlePrevious();
      } else if (event.key === 'ArrowRight' && hasNext) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrevious, hasNext]);

  // Navigation functions
  const handlePrevious = () => {
    if (hasPrevious) {
      const prevWallet = navCreators[currentIndex - 1];
      const tab = searchParams.get('tab') || 'creators';
      const queryString = `from=${from}&tab=${tab}&nav=${encodeURIComponent(JSON.stringify(navCreators))}`;
      navigate(`/profile/${prevWallet}?${queryString}`);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const nextWallet = navCreators[currentIndex + 1];
      const tab = searchParams.get('tab') || 'creators';
      const queryString = `from=${from}&tab=${tab}&nav=${encodeURIComponent(JSON.stringify(navCreators))}`;
      navigate(`/profile/${nextWallet}?${queryString}`);
    }
  };

  // Toggle follow with optimistic update
  const handleToggleFollow = async (creatorWallet: string) => {
    if (!publicKey) {
      toast.error('Please connect your wallet to follow creators');
      return;
    }
    const wasFollowing = isFollowing(creatorWallet);
    const ok = await toggleFollow(creatorWallet);
    if (ok) {
      setCreator(prev => prev ? { 
        ...prev, 
        follower_count: Math.max(0, (prev.follower_count || 0) + (wasFollowing ? -1 : 1)) 
      } : prev);
    }
  };

  // Toggle NFT like with optimistic update
  const handleToggleLike = async (nftId: string) => {
    if (!publicKey) {
      toast.error('Please connect your wallet to like NFTs');
      return;
    }
    const wasLiked = isLiked(nftId);
    const ok = await toggleLike(nftId);
    if (ok) {
      setCreatorNFTs(prev => prev.map(n => n.id === nftId ? { ...n, likes_count: Math.max(0, n.likes_count + (wasLiked ? -1 : 1)) } : n));
    }
  };

  // Fetch creator data
  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!wallet) return;

      try {
        setLoading(true);
        
        // Fetch creator profile and stats
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('wallet_address', wallet)
          .single();

        const { data: stats } = await supabase
          .from('creators_public_stats')
          .select('*')
          .eq('wallet_address', wallet)
          .single();

        // Fetch creator's NFTs
        const { data: nfts } = await supabase
          .from('nfts')
          .select('*')
          .eq('creator_address', wallet)
          .order('created_at', { ascending: false });

        // Fetch creator's Collections  
        const { data: collections } = await supabase
          .from('collections')
          .select('*')
          .eq('creator_address', wallet)
          .order('created_at', { ascending: false });

        // Fetch creator's liked NFTs
        const { data: likedNFTIds } = await supabase
          .from('nft_likes')
          .select('nft_id')
          .eq('user_wallet', wallet);

        let creatorLikedNFTs: NFT[] = [];
        if (likedNFTIds && likedNFTIds.length > 0) {
          const { data: nftDetails } = await supabase
            .from('nfts')
            .select('*')
            .in('id', likedNFTIds.map(l => l.nft_id));
          
          if (nftDetails) {
            creatorLikedNFTs = nftDetails.map(nft => ({
              id: nft.id,
              name: nft.name,
              image_url: nft.image_url,
              price: nft.price,
              collection_address: nft.collection_id,
              collection_name: undefined,
              likes_count: 0
            }));
          }
        }

        // Fetch creator's liked Collections
        const { data: likedCollectionIds } = await supabase
          .from('collection_likes')
          .select('collection_id')
          .eq('user_wallet', wallet);

        let creatorLikedCollections: Collection[] = [];
        if (likedCollectionIds && likedCollectionIds.length > 0) {
          const { data: collectionDetails } = await supabase
            .from('collections')
            .select('*')
            .in('id', likedCollectionIds.map(l => l.collection_id));
          
          if (collectionDetails) {
            creatorLikedCollections = collectionDetails.map(collection => ({
              id: collection.id,
              name: collection.name,
              image_url: collection.image_url || collection.banner_image_url,
              description: collection.description,
              items_total: collection.max_supply || 0,
              items_redeemed: collection.items_redeemed || 0,
              verified: collection.verified || false
            }));
          }
        }

        if (profile) {
          setCreator({
            wallet_address: profile.wallet_address,
            nickname: profile.nickname,
            bio: profile.bio,
            profile_image_url: profile.profile_image_url,
            banner_image_url: profile.banner_image_url,
            trade_count: profile.trade_count || 0,
            profile_rank: profile.profile_rank || 'DEFAULT',
            verified: profile.verified,
            follower_count: stats?.follower_count || 0,
            nft_likes_count: stats?.nft_likes_count || 0,
            created_nfts: nfts?.length || 0,
          });
        }

        // Process NFTs data with like counts
        if (nfts) {
          const nftIds = nfts.map(n => n.id);
          const { data: likeRows } = await supabase
            .from('nft_likes')
            .select('nft_id')
            .in('nft_id', nftIds);

          const counts: Record<string, number> = {};
          (likeRows || []).forEach((r: any) => {
            counts[r.nft_id] = (counts[r.nft_id] || 0) + 1;
          });

          setCreatorNFTs(nfts.map(nft => ({
            id: nft.id,
            name: nft.name,
            image_url: nft.image_url,
            price: nft.price,
            collection_address: nft.collection_id,
            collection_name: undefined,
            likes_count: counts[nft.id] || 0
          })));
        }

        // Set collections and liked items
        setCreatorCollections(collections ? collections.map(collection => ({
          id: collection.id,
          name: collection.name,
          image_url: collection.image_url || collection.banner_image_url,
          description: collection.description,
          items_total: collection.max_supply || 0,
          items_redeemed: collection.items_redeemed || 0,
          verified: collection.verified || false
        })) : []);

        setLikedNFTs(creatorLikedNFTs);
        setLikedCollections(creatorLikedCollections);

      } catch (error) {
        console.error('Error fetching creator data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [wallet]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/marketplace?tab=creators')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
        
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/marketplace?tab=creators')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
          <p className="text-muted-foreground">The creator profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header with navigation */}
      <div className="mb-8 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => {
            const tab = searchParams.get('tab') || 'creators';
            navigate(from === 'marketplace' ? `/marketplace?tab=${tab}` : '/marketplace?tab=creators');
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {from === 'marketplace' ? 'Marketplace' : 'Creators'}
        </Button>

        {/* Navigation Controls */}
        {navCreators.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {currentIndex + 1} of {navCreators.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!hasNext}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Profile Section - Exact copy of Profile.tsx layout but read-only */}
      <div className="mb-8">
        {/* Banner - No edit button */}
        <AspectRatio ratio={4 / 1} className="relative w-full rounded-lg overflow-hidden">
          <ImageLazyLoad
            src={creator.banner_image_url || profileBanner}
            alt="Profile Banner"
            className="absolute inset-0 w-full h-full object-cover"
            fallbackSrc="/placeholder.svg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </AspectRatio>

        {/* Profile Info - No edit buttons */}
        <div className="flex items-start justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="relative -mt-16">
              <Avatar className="w-40 h-40 rounded-full border-4 border-background bg-card">
                <AvatarImage src={creator.profile_image_url || '/placeholder.svg'} alt="Avatar" />
                <AvatarFallback className="text-3xl font-bold">
                  {creator?.nickname?.charAt(0)?.toUpperCase() || creator.wallet_address.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{creator.nickname || `${creator.wallet_address.slice(0, 4)}...${creator.wallet_address.slice(-4)}`}</h2>
                  <button
                    onClick={() => handleToggleFollow(creator.wallet_address)}
                    className="transition-colors duration-200"
                    disabled={!publicKey || followLoading}
                    aria-label={isFollowing(creator.wallet_address) ? 'Unfollow' : 'Follow'}
                    title={isFollowing(creator.wallet_address) ? 'Unfollow' : 'Follow'}
                  >
                    <Heart className={`w-5 h-5 ${
                      publicKey && isFollowing(creator.wallet_address)
                        ? 'fill-red-500 text-red-500' 
                        : 'text-muted-foreground hover:text-red-500'
                    }`} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {`${creator.wallet_address.slice(0,4)}...${creator.wallet_address.slice(-4)}`}
              </p>

              {/* Bio Section - Read-only */}
              <div className="max-w-md">
                <p className="text-muted-foreground text-sm italic">
                  {creator.bio || 'No bio available'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Matching Profile.tsx exactly */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-secondary/5 border-secondary/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center">
                        <span className="text-2xl font-bold text-foreground mr-1">
                          {getRankBadge(creator.profile_rank).icon}
                        </span>
                        <span className="text-2xl font-bold text-foreground">
                          {getRankBadge(creator.profile_rank).text}
                        </span>
                        <span className="text-2xl font-bold text-foreground mx-2">/</span>
                        <span className="text-2xl font-bold text-foreground">
                          {creator.trade_count}
                        </span>
                        <div className="w-5 h-5 ml-2 bg-blue-500 rounded-full flex items-center justify-center">
                          <Info className="w-3 h-3 text-white" />
                        </div>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold">🏆 Diamond: 1,000+ trades</p>
                        <p className="font-semibold">🥇 Gold: 250+ trades</p>
                        <p className="font-semibold">🥈 Silver: 50+ trades</p>
                        <p className="font-semibold">🥉 Bronze: 10+ trades</p>
                        <p className="font-semibold">🌟 Starter: 0-9 trades</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">Rank / Trades</p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground mb-2">{creatorCollections.length}</div>
              <p className="text-sm text-muted-foreground">Collections</p>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground mb-2">{likedNFTs.length + likedCollections.length}</div>
              <p className="text-sm text-muted-foreground">Liked Items</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs - Matching Profile.tsx structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="nfts">Owned NFTs</TabsTrigger>
          <TabsTrigger value="liked-nfts">Liked NFTs</TabsTrigger>
          <TabsTrigger value="liked-collections">Liked Collections</TabsTrigger>
        </TabsList>

        {/* Collections Tab */}
        <TabsContent value="collections" className="mt-6">
          {creatorCollections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No collections created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creatorCollections.map((collection) => (
                <Card 
                  key={collection.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                  onClick={() => navigate(`/collection/${collection.id}`)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <ImageLazyLoad
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackSrc="/placeholder.svg"
                    />
                    
                    {/* Heart button for liking collections */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollectionLike(collection.id);
                      }}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
                        isCollectionLiked(collection.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isCollectionLiked(collection.id) ? 'fill-current' : ''}`} />
                    </button>

                    {/* Status badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {collection.verified && (
                        <Badge variant="secondary" className="bg-blue-500/90 text-white">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {collection.name}
                    </h3>
                    
                    {collection.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {collection.items_redeemed}/{collection.items_total || '∞'} minted
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Owned NFTs Tab */}
        <TabsContent value="nfts" className="mt-6">
          {creatorNFTs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No NFTs owned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {creatorNFTs.map((nft) => (
                <Card key={nft.id} className="group hover:shadow-lg transition-all cursor-pointer relative overflow-hidden">
                  <CardContent className="p-4">
                     <div 
                       className="aspect-square relative mb-3 overflow-hidden rounded-lg cursor-pointer"
                       onClick={() => navigate(`/nft/${nft.id}`)}
                     >
                       <ImageLazyLoad
                         src={nft.image_url}
                         alt={nft.name}
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                         fallbackSrc="/placeholder.svg"
                       />
                      
                      {/* Heart button for liking NFTs */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(nft.id);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
                          isLiked(nft.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-black/50 text-white hover:bg-black/70'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked(nft.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    <h4 className="font-medium truncate mb-2">{nft.name}</h4>
                    <div className="flex items-center justify-between">
                      {nft.price && (
                        <span className="text-sm font-medium">{nft.price} SOL</span>
                      )}
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-muted-foreground">{nft.likes_count} likes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Liked NFTs Tab */}
        <TabsContent value="liked-nfts" className="mt-6">
          {likedNFTs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No liked NFTs yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {likedNFTs.map((nft) => (
                <Card key={nft.id} className="group hover:shadow-lg transition-all cursor-pointer relative overflow-hidden">
                  <CardContent className="p-4">
                     <div 
                       className="aspect-square relative mb-3 overflow-hidden rounded-lg cursor-pointer"
                       onClick={() => navigate(`/nft/${nft.id}`)}
                     >
                       <ImageLazyLoad
                         src={nft.image_url}
                         alt={nft.name}
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                         fallbackSrc="/placeholder.svg"
                       />
                     </div>
                    
                    <h4 className="font-medium truncate mb-2">{nft.name}</h4>
                    <div className="flex items-center justify-between">
                      {nft.price && (
                        <span className="text-sm font-medium">{nft.price} SOL</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Liked Collections Tab */}
        <TabsContent value="liked-collections" className="mt-6">
          {likedCollections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No liked collections yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedCollections.map((collection) => (
                <Card 
                  key={collection.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                  onClick={() => navigate(`/collection/${collection.id}`)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <ImageLazyLoad
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackSrc="/placeholder.svg"
                    />

                    {/* Status badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {collection.verified && (
                        <Badge variant="secondary" className="bg-blue-500/90 text-white">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {collection.name}
                    </h3>
                    
                    {collection.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {collection.items_redeemed}/{collection.items_total || '∞'} minted
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}