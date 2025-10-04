import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, ArrowLeft, ChevronLeft, ChevronRight, Info, ExternalLink, Grid3x3, UserMinus, UserPlus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatorFollowsByUser } from '@/hooks/useCreatorFollowsByUser';
import { FollowedAuthorCard } from '@/components/FollowedAuthorCard';
import { useRealtimeCreatorStatsByUser } from '@/hooks/useRealtimeCreatorStatsByUser';
import { useRealtimeNFTStats } from '@/hooks/useRealtimeNFTStats';
import { useNFTLikes } from "@/hooks/useNFTLikes";
import { useCollectionLikes } from "@/hooks/useCollectionLikes";
import SocialActionWrapper from '@/components/SocialActionWrapper';
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageLazyLoad } from "@/components/ImageLazyLoad";
import profileBanner from '@/assets/profile-banner.jpg';
import { getNavContext, clearNavContext, setNavContext } from "@/lib/navContext";
import { NFTCard } from '@/components/NFTCard';

interface Creator {
  wallet_address?: string; // Optional - only available for own profile
  user_id?: string;
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
  const { isFollowingUserId, toggleFollowByUserId, loading: followLoading } = useCreatorFollowsByUser();
  const { isLiked, toggleLike, loading: nftLikeLoading } = useNFTLikes();
  const { isLiked: isCollectionLiked, toggleLike: toggleCollectionLike } = useCollectionLikes();
  const { user } = useAuth();
  
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorNFTs, setCreatorNFTs] = useState<NFT[]>([]);
  const [creatorCollections, setCreatorCollections] = useState<Collection[]>([]);
  const [likedNFTs, setLikedNFTs] = useState<NFT[]>([]);
  const [likedCollections, setLikedCollections] = useState<Collection[]>([]);
  const [followedCreators, setFollowedCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("collections");
  
  // Get real-time stats for creators by user ID
  const followedCreatorUserIds = followedCreators.map(f => f.user_id).filter(Boolean);
  const currentCreatorUserId = creator?.user_id;
  
  const { getCreatorFollowerCount } = useRealtimeCreatorStatsByUser(followedCreatorUserIds);
  const { getCreatorFollowerCount: getCurrentCreatorFollowerCount, getCreatorNFTLikeCount } = useRealtimeCreatorStatsByUser(
    currentCreatorUserId ? [currentCreatorUserId] : []
  );

  // Get real-time NFT stats for displaying accurate like counts
  const creatorNFTIds = creatorNFTs.map(nft => nft.id);
  const { getNFTLikeCount } = useRealtimeNFTStats(creatorNFTIds);

  // Listen for cross-page creator stats updates to refresh current creator
  useEffect(() => {
    const handleStatsUpdate = (event: CustomEvent) => {
      const { userId: updatedUserId } = event.detail;
      if (updatedUserId === creator?.user_id) {
        // Creator stats will update automatically via useRealtimeCreatorStatsByUser
      }
    };

    window.addEventListener('creator-stats-update-by-user', handleStatsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('creator-stats-update-by-user', handleStatsUpdate as EventListener);
    };
  }, [creator?.user_id]);

  // Navigation state - use storage context with legacy URL support
  const navContext = getNavContext('nft'); // Creator profiles can navigate through creator lists
  const from = navContext?.source || searchParams.get('from');
  const navCreators = navContext?.items || (searchParams.get('nav') ? JSON.parse(decodeURIComponent(searchParams.get('nav')!)) : []);
  const currentIndex = wallet ? navCreators.indexOf(wallet) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < navCreators.length - 1;

  // Clean legacy URL parameters on mount
  useEffect(() => {
    const hasLegacyParams = searchParams.get('nav') || searchParams.get('from');
    if (hasLegacyParams) {
      navigate(window.location.pathname, { replace: true });
    }
  }, [navigate, searchParams]);

  // Navigation functions
  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      const prevWallet = navCreators[currentIndex - 1];
      navigate(`/profile/${prevWallet}`);
    }
  }, [hasPrevious, navCreators, currentIndex, navigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      const nextWallet = navCreators[currentIndex + 1];
      navigate(`/profile/${nextWallet}`);
    }
  }, [hasNext, navCreators, currentIndex, navigate]);

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
  }, [hasPrevious, hasNext, handlePrevious, handleNext]);

  // Toggle follow with real-time stats
  const handleToggleFollow = async (creatorUserId: string) => {
    try {
      // Real-time stats will update automatically via cross-page signals
      await toggleFollowByUserId(creatorUserId);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Toggle NFT like with real-time stats
  const handleToggleLike = async (nftId: string) => {
    const nft = creatorNFTs.find(n => n.id === nftId);
    if (!nft) return;

    try {
      // Pass creator address for optimistic updates (use wallet as creator address since this is the creator's own NFTs)
      await toggleLike(nftId, wallet || undefined);
    } catch (error) {
      console.error('Error toggling NFT like:', error);
    }
  };

  // Helper function to handle NFT navigation
  const handleNFTClick = (nftId: string, nftList: NFT[]) => {
    // Set navigation context for NFT browsing
    setNavContext({
      type: 'nft',
      items: nftList.map(n => n.id),
      source: 'creator',
      tab: activeTab
    });
  };

  // Fetch creator data
  useEffect(() => {
    console.log('CreatorProfile: useEffect triggered for wallet:', wallet);
    const fetchCreatorData = async () => {
      if (!wallet) {
        console.log('CreatorProfile: No wallet provided');
        return;
      }

      try {
        console.log('CreatorProfile: Starting to fetch data for wallet:', wallet);
        setLoading(true);
        
        // Fetch creator profile using edge function
        console.log('CreatorProfile: Calling get-profile edge function for:', wallet);
        const { data: profileResponse, error: profileError } = await supabase.functions.invoke('get-profile', {
          body: { wallet_address: wallet }
        });
        console.log('CreatorProfile: get-profile response:', profileResponse);
        console.log('CreatorProfile: get-profile error:', profileError);
        const profile = (profileResponse && typeof profileResponse === 'object')
          ? (profileResponse as any).profile ?? (profileResponse as any)
          : null;

        // Use RPC function for creator stats
        const { data: stats } = await supabase.rpc('get_creators_public_stats');

        // Find stats for this specific creator by user_id
        const creatorStats = (stats || []).find((s: any) => s.creator_user_id === profile?.user_id);

        // Fetch creator's NFTs using secure RPC function
        const { data: allNfts } = await supabase.rpc('get_nfts_public');
        // Since we only have masked creator addresses, we need to check both full and masked
        const maskedWallet = `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
        const nfts = (allNfts || [])
          .filter((nft: any) => nft.creator_address_masked === maskedWallet)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Fetch creator's Collections using secure RPC function
        const { data: allCollections } = await supabase.rpc('get_collections_public_masked');
        const collections = (allCollections || [])
          .filter((collection: any) => collection.creator_address_masked === maskedWallet)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Fetch creator's liked NFTs (only for authenticated users viewing their own profile)
        let creatorLikedNFTs: NFT[] = [];
        if (user && profile?.user_id === user.id) {
          const { data: likedNFTIds } = await (supabase as any)
            .from('nft_likes')
            .select('nft_id')
            .eq('user_id', user.id);

          if (likedNFTIds && likedNFTIds.length > 0) {
            const { data: allNftDetails } = await (supabase as any).rpc('get_nfts_authenticated');
            const nftDetails = (allNftDetails || []).filter((nft: any) => 
              likedNFTIds.some((l: any) => l.nft_id === nft.id)
            );
            
            if (nftDetails) {
              creatorLikedNFTs = nftDetails.map((nft: any) => ({
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
        }

        // Fetch creator's liked Collections (only for authenticated users viewing their own profile)
        let creatorLikedCollections: Collection[] = [];
        if (user && profile?.user_id === user.id) {
          const { data: likedCollectionIds } = await (supabase as any)
            .from('collection_likes')
            .select('collection_id')
            .eq('user_id', user.id);

          if (likedCollectionIds && likedCollectionIds.length > 0) {
            const { data: allCollectionDetails } = await (supabase as any).rpc('get_collections_authenticated');
            const collectionDetails = (allCollectionDetails || []).filter((collection: any) => 
              likedCollectionIds.some((l: any) => l.collection_id === collection.id)
            );
            
            if (collectionDetails) {
              creatorLikedCollections = collectionDetails.map((collection: any) => ({
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
        }

        if (profile) {
          console.log('CreatorProfile: Profile found:', profile);
          setCreator({
            wallet_address: profile.wallet_address, // May be undefined for other users
            user_id: profile.user_id,
            nickname: profile.nickname,
            bio: profile.bio,
            profile_image_url: profile.profile_image_url,
            banner_image_url: profile.banner_image_url,
            trade_count: profile.trade_count || 0,
            profile_rank: profile.profile_rank || 'DEFAULT',
            verified: profile.verified || false,
            follower_count: creatorStats?.follower_count || 0,
            nft_likes_count: creatorStats?.nft_likes_count || 0,
            created_nfts: nfts?.length || 0,
          });
        } else {
          console.log('CreatorProfile: No profile found for wallet:', wallet);
        }

        // Process NFTs data with like counts using RLS-safe RPC
        if (nfts) {
          const nftIds = nfts.map(n => n.id);
          
          // Use RLS-safe RPC function to get like counts
          const { data: likeCounts } = await supabase.rpc('get_nft_like_counts_public');
          
          const counts: Record<string, number> = {};
          (likeCounts || []).forEach((item: any) => {
            if (nftIds.includes(item.nft_id)) {
              counts[item.nft_id] = Number(item.like_count) || 0;
            }
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

        // Fetch creators this creator follows (only for authenticated users viewing their own profile)
        let followedCreatorsData: any[] = [];
        if (user && profile?.user_id === user.id) {
          const { data: followedCreatorIds } = await (supabase as any)
            .from('creator_follows')
            .select('creator_user_id')
            .eq('follower_user_id', user.id);

          if (followedCreatorIds && followedCreatorIds.length > 0) {
            const { data: profiles } = await (supabase as any).rpc('get_profiles_authenticated');
            const matchingProfiles = (profiles || []).filter((p: any) => 
              followedCreatorIds.some((f: any) => f.creator_user_id === p.id)
            );
            
            followedCreatorsData = matchingProfiles.map((p: any) => ({
              wallet_address: p.wallet_address,
              user_id: p.id,
              nickname: p.nickname,
              bio: p.bio,
              profile_image_url: p.profile_image_url
            }));
          }
        }
        setFollowedCreators(followedCreatorsData);

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
          Back
        </Button>
        
        {/* Navigation arrows */}
        {(hasPrevious || hasNext) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {navCreators.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!hasNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Profile banner */}
      <div className="relative w-full h-48 md:h-64 mb-8 rounded-lg overflow-hidden">
        <ImageLazyLoad
          src={creator.banner_image_url || profileBanner}
          alt="Profile banner"
          className="w-full h-full object-cover"
          fallbackSrc={profileBanner}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Profile info */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={creator.profile_image_url} />
            <AvatarFallback className="text-2xl">
              {creator.nickname?.charAt(0) || (wallet ? wallet.slice(0, 2).toUpperCase() : '??')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl font-bold">
                {creator.nickname || (wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Unknown')}
              </h1>
              
              <div className="flex items-center gap-2">
                {creator.verified && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Verified
                  </Badge>
                )}
                
                {/* Rank badge */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline">
                        {getRankBadge(creator.profile_rank).icon} {getRankBadge(creator.profile_rank).text}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{creator.trade_count} trades completed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {creator.bio && (
              <p className="text-muted-foreground mt-2">{creator.bio}</p>
            )}
          </div>
          
          {/* Follow button - only show if not viewing own profile */}
          {user && creator.user_id && creator.user_id !== user.id && (
            <SocialActionWrapper
              requireAuth={true}
              action="follow"
              onAction={() => handleToggleFollow(creator.user_id!)}
            >
              <Button
                variant={isFollowingUserId(creator.user_id) ? "secondary" : "default"}
                disabled={followLoading}
                className="shrink-0"
              >
                {isFollowingUserId(creator.user_id) ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            </SocialActionWrapper>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{getCurrentCreatorFollowerCount(creator.user_id || '') || creator.follower_count}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{creator.created_nfts}</div>
              <div className="text-sm text-muted-foreground">NFTs Created</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{getCreatorNFTLikeCount(creator.user_id || '') || creator.nft_likes_count}</div>
              <div className="text-sm text-muted-foreground">NFT Likes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{creator.trade_count}</div>
              <div className="text-sm text-muted-foreground">Trades</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs - Matching Profile.tsx structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collections">My Collections</TabsTrigger>
          <TabsTrigger value="nfts">My NFTs</TabsTrigger>
          <TabsTrigger value="liked-nfts">NFTs I Like</TabsTrigger>
          <TabsTrigger value="following">Authors I Follow</TabsTrigger>
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
                <NFTCard
                  key={nft.id}
                  nft={{
                    id: nft.id,
                    name: nft.name,
                    image_url: nft.image_url,
                    owner_address: wallet || '',
                    mint_address: nft.id,
                    creator_address: wallet || '',
                    price: nft.price,
                    is_listed: true,
                    collection_id: nft.collection_address,
                    description: '',
                    attributes: undefined,
                    collections: nft.collection_name ? { name: nft.collection_name } : undefined
                  }}
                  likeCount={getNFTLikeCount(nft.id)}
                  showOwnerInfo={false}
                  onNavigate={() => {
                    handleNFTClick(nft.id, creatorNFTs);
                    navigate(`/nft/${nft.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Liked NFTs Tab */}
        <TabsContent value="liked-nfts" className="mt-6">
          {likedNFTs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No liked NFTs yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {likedNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={{
                    id: nft.id,
                    name: nft.name,
                    image_url: nft.image_url,
                    owner_address: '',
                    mint_address: nft.id,
                    creator_address: '',
                    price: nft.price,
                    is_listed: true,
                    collection_id: nft.collection_address,
                    description: '',
                    attributes: undefined,
                    collections: nft.collection_name ? { name: nft.collection_name } : undefined
                  }}
                  likeCount={getNFTLikeCount(nft.id)}
                  showOwnerInfo={true}
                  onNavigate={() => navigate(`/nft/${nft.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="mt-6">
          {followedCreators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Not following any creators yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followedCreators.map((followedCreator) => (
                <FollowedAuthorCard
                  key={followedCreator.user_id}
                  wallet_address={followedCreator.wallet_address || 'Unknown'}
                  nickname={followedCreator.nickname}
                  bio={followedCreator.bio}
                  profile_image_url={followedCreator.profile_image_url}
                  followerCount={getCreatorFollowerCount(followedCreator.user_id) || 0}
                  onClick={(walletAddress) => navigate(`/profile/${walletAddress}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}