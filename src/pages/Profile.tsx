
import defaultBanner from '@/assets/default-profile-banner.jpg';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, CheckCircle, Star, Info, Share, Copy, UserPlus, UserMinus } from 'lucide-react';
import { NFTCard } from '@/components/NFTCard';
import { CollectionCard } from '@/components/CollectionCard';
import { SearchFilterBar, FilterState } from '@/components/SearchFilterBar';
import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useUserNFTs } from '@/hooks/useUserNFTs';
import { useCollections } from '@/hooks/useCollections';
import { useLikedNFTs } from '@/hooks/useLikedNFTs';
import { useLikedCollections } from '@/hooks/useLikedCollections';
import { useCreatorFollows } from '@/hooks/useCreatorFollows';
import { useNFTLikeCounts, useCollectionLikeCounts } from '@/hooks/useLikeCounts';
import { useFilteredNFTs, useFilteredCollections } from "@/hooks/useFilteredData";
import { useRealtimeCreatorStats } from '@/hooks/useRealtimeCreatorStats';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setNavContext } from "@/lib/navContext";

const Profile = () => {
  const { wallet } = useParams();
  const { publicKey, connected } = useSolanaWallet();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showRankInfo, setShowRankInfo] = useState(false);

  const targetWallet = wallet || publicKey;

  // Data hooks
  const { nfts, loading: nftsLoading, fetchUserNFTs } = useUserNFTs();
  const { collections, loading: collectionsLoading } = useCollections();
  const { likedNFTs } = useLikedNFTs();
  const { likedCollections } = useLikedCollections();
  const { followedCreators, isFollowing, toggleFollow, loading: followLoading } = useCreatorFollows();
  const { getLikeCount: getNFTLikeCount } = useNFTLikeCounts();
  const { getLikeCount: getCollectionLikeCount } = useCollectionLikeCounts();
  
  // Real-time creator stats
  const { getCreatorFollowerCount, getCreatorTotalLikeCount } = useRealtimeCreatorStats(
    targetWallet ? [targetWallet] : []
  );

  // Filter states
  const [nftFilters, setNftFilters] = useState<FilterState>({
    searchQuery: '',
    source: 'all',
    sortBy: 'newest',
    includeExplicit: false,
    category: 'all',
    minPrice: '',
    maxPrice: '',
    minRoyalty: '',
    maxRoyalty: '',
    listing: 'all'
  });

  const [collectionFilters, setCollectionFilters] = useState<FilterState>({
    searchQuery: '',
    source: 'all',
    sortBy: 'newest',
    includeExplicit: false,
    category: 'all',
    minPrice: '',
    maxPrice: '',
    minRoyalty: '',
    maxRoyalty: ''
  });

  useEffect(() => {
    setIsOwnProfile(connected && targetWallet === publicKey);
  }, [connected, targetWallet, publicKey]);

  // Helper functions for rank progression
  const getRankProgress = (tradeCount: number) => {
    const thresholds = { DEFAULT: 0, BRONZE: 10, SILVER: 50, GOLD: 250, DIAMOND: 1000 };
    const currentRank = profile?.profile_rank || 'DEFAULT';
    
    if (currentRank === 'DIAMOND') return { progress: 100, nextRank: null, needed: 0 };
    
    const nextRankMap = { DEFAULT: 'BRONZE', BRONZE: 'SILVER', SILVER: 'GOLD', GOLD: 'DIAMOND' };
    const nextRank = nextRankMap[currentRank as keyof typeof nextRankMap];
    const nextThreshold = thresholds[nextRank as keyof typeof thresholds];
    const currentThreshold = thresholds[currentRank as keyof typeof thresholds];
    
    const progress = Math.min(100, ((tradeCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
    const needed = Math.max(0, nextThreshold - tradeCount);
    
    return { progress, nextRank, needed };
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetWallet) {
        // No wallet connected or provided via URL -> show connect message
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-profile', {
          body: { wallet_address: targetWallet }
        });
        
        if (error) {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load profile');
          return;
        }
        
        
        setProfile(data || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetWallet]);

  // Get collections created by this user
  const userCollections = useMemo(() => {
    return collections.filter(collection => 
      collection.creator_address === targetWallet && collection.is_active
    );
  }, [collections, targetWallet]);

  // Get NFTs and Collections from liked creators
  const nftsFromLikedCreators = useMemo(() => {
    return nfts.filter(nft => followedCreators.includes(nft.creator_address));
  }, [nfts, followedCreators]);

  const collectionsFromLikedCreators = useMemo(() => {
    return userCollections.filter(collection => 
      followedCreators.includes(collection.creator_address)
    );
  }, [userCollections, followedCreators]);

  // Apply filters - Convert UserNFT to NFT format
  const nftsForFiltering = nfts.map(nft => ({
    id: nft.id,
    name: nft.name,
    description: nft.description,
    is_listed: nft.is_listed || false,
    creator_address: nft.creator_address || targetWallet || '',
    created_at: nft.created_at || new Date().toISOString(),
    category: undefined,
    price: nft.price,
    attributes: undefined
  }));

  // Also map likedNFTs to include created_at
  const likedNFTsForFiltering = likedNFTs.map(nft => ({
    ...nft,
    created_at: new Date().toISOString()
  }));

  // Map nftsFromLikedCreators to NFT format
  const nftsFromLikedCreatorsForFiltering = nftsFromLikedCreators.map(nft => ({
    id: nft.id,
    name: nft.name,
    description: nft.description,
    is_listed: nft.is_listed || false,
    creator_address: nft.creator_address || '',
    created_at: nft.created_at || new Date().toISOString(),
    category: undefined,
    price: nft.price,
    attributes: undefined
  }));

  const filteredNFTs = useFilteredNFTs(
    nftsForFiltering,
    likedNFTsForFiltering,
    nftsFromLikedCreatorsForFiltering,
    followedCreators,
    nftFilters,
    getNFTLikeCount
  );

  // Convert collections to include created_at for filtering
  const collectionsForFiltering = userCollections.map(collection => ({
    ...collection,
    created_at: collection.created_at || new Date().toISOString()
  }));

  const likedCollectionsForFiltering = likedCollections.map(collection => ({
    ...collection,
    created_at: new Date().toISOString()
  }));

  const filteredCollections = useFilteredCollections(
    collectionsForFiltering,
    likedCollectionsForFiltering,
    collectionsFromLikedCreators,
    followedCreators,
    collectionFilters,
    getCollectionLikeCount
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!targetWallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="py-10 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your Solana wallet to view and customize your profile.
            </p>
            <SolanaWalletButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-64 rounded-lg overflow-hidden" data-testid="profile-banner">
          <img 
            src={profile?.banner_image_url || defaultBanner} 
            alt="Profile Banner" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Avatar - overlapping banner */}
        <div className="relative -mt-20 px-6">
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto sm:mx-0 z-10">
            <div className="w-full h-full rounded-full border-4 border-background bg-muted-foreground/20 overflow-hidden backdrop-blur-sm" data-testid="profile-avatar">
              {profile?.profile_image_url ? (
                <img 
                  src={profile.profile_image_url} 
                  alt="Profile Picture" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20 text-3xl font-bold text-foreground">
                  {targetWallet?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info - below banner */}
        <div className="px-6 pt-4 pb-6">
          <div className="space-y-3">
              {/* Name */}
              <div>
                <h1 className="text-2xl font-bold text-foreground" data-testid="profile-name">
                  {profile?.display_name || profile?.nickname || `${targetWallet?.slice(0, 4)}...${targetWallet?.slice(-4)}`}
                </h1>
              </div>

              {/* Wallet (short) with copy */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {targetWallet?.slice(0, 4)}...{targetWallet?.slice(-4)}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0"
                  onClick={() => copyToClipboard(targetWallet || '')}
                  aria-label="Copy wallet address"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Starter Badge */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {profile?.profile_rank && profile.profile_rank !== 'DEFAULT' 
                          ? profile.profile_rank.charAt(0) + profile.profile_rank.slice(1).toLowerCase()
                          : 'Starter'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Learn about ranks</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Dialog open={showRankInfo} onOpenChange={setShowRankInfo}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 p-0"
                      aria-label="About ranks"
                      data-testid="rank-info-button"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Profile Ranks</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="text-sm space-y-1">
                          <div className={`flex justify-between items-center p-2 rounded ${
                            (profile?.profile_rank ?? 'DEFAULT') === 'DEFAULT' ? 'bg-muted/50 border border-primary/30' : ''
                          }`}>
                            <span className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>Starter:</span>
                              {(profile?.profile_rank ?? 'DEFAULT') === 'DEFAULT' && (
                                <span className="text-xs text-primary font-medium">Your current rank ({profile?.trade_count || 0} trades)</span>
                              )}
                            </span>
                            <span className="text-muted-foreground">0-9 trades</span>
                          </div>
                          <div className={`flex justify-between items-center p-2 rounded ${
                            profile?.profile_rank === 'BRONZE' ? 'bg-muted/50 border border-primary/30' : ''
                          }`}>
                            <span className="flex items-center gap-2">
                              🥉 <span>Bronze:</span>
                              {profile?.profile_rank === 'BRONZE' && (
                                <span className="text-xs text-primary font-medium">Your current rank ({profile?.trade_count || 0} trades)</span>
                              )}
                            </span>
                            <span className="text-muted-foreground">10-49 trades</span>
                          </div>
                          <div className={`flex justify-between items-center p-2 rounded ${
                            profile?.profile_rank === 'SILVER' ? 'bg-muted/50 border border-primary/30' : ''
                          }`}>
                            <span className="flex items-center gap-2">
                              🥈 <span>Silver:</span>
                              {profile?.profile_rank === 'SILVER' && (
                                <span className="text-xs text-primary font-medium">Your current rank ({profile?.trade_count || 0} trades)</span>
                              )}
                            </span>
                            <span className="text-muted-foreground">50-199 trades</span>
                          </div>
                          <div className={`flex justify-between items-center p-2 rounded ${
                            profile?.profile_rank === 'GOLD' ? 'bg-muted/50 border border-primary/30' : ''
                          }`}>
                            <span className="flex items-center gap-2">
                              🥇 <span>Gold:</span>
                              {profile?.profile_rank === 'GOLD' && (
                                <span className="text-xs text-primary font-medium">Your current rank ({profile?.trade_count || 0} trades)</span>
                              )}
                            </span>
                            <span className="text-muted-foreground">200-999 trades</span>
                          </div>
                          <div className={`flex justify-between items-center p-2 rounded ${
                            profile?.profile_rank === 'DIAMOND' ? 'bg-muted/50 border border-primary/30' : ''
                          }`}>
                            <span className="flex items-center gap-2">
                              💎 <span>Diamond:</span>
                              {profile?.profile_rank === 'DIAMOND' && (
                                <span className="text-xs text-primary font-medium">Your current rank ({profile?.trade_count || 0} trades)</span>
                              )}
                            </span>
                            <span className="text-muted-foreground">1000+ trades</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div>
                  <p className="text-muted-foreground break-words whitespace-normal min-h-[1.25rem]" data-testid="profile-bio">
                    {profile.bio.length > 90 ? `${profile.bio.slice(0, 90)}...` : profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Actions Row */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => targetWallet && toggleFollow(targetWallet)}
              disabled={followLoading}
            >
              {isFollowing(targetWallet || '') ? (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => copyToClipboard(window.location.href)}
              aria-label="Share profile"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-lg font-bold text-foreground">
                {getCreatorFollowerCount(targetWallet || '')}
              </div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-lg font-bold text-foreground">
                {getCreatorTotalLikeCount(targetWallet || '')}
              </div>
              <div className="text-xs text-muted-foreground">Total Likes</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-lg font-bold text-foreground">
                {userCollections.length}
              </div>
              <div className="text-xs text-muted-foreground">Collections</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-lg font-bold text-foreground">
                {nfts.length}
              </div>
              <div className="text-xs text-muted-foreground">NFTs</div>
            </div>
          </div>
        </div>

        {/* Rank Progress Indicator */}
        {profile && (
          <div className="px-6 pb-6">
            <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">
                    {profile.profile_rank && profile.profile_rank !== 'DEFAULT' 
                      ? profile.profile_rank.charAt(0) + profile.profile_rank.slice(1).toLowerCase()
                      : 'Starter'} Rank
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {profile.trade_count || 0} trades
                </span>
              </div>
              
              {(() => {
                const { progress, nextRank, needed } = getRankProgress(profile.trade_count || 0);
                return nextRank ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress to {nextRank.charAt(0) + nextRank.slice(1).toLowerCase()}</span>
                      <span>{needed} trades needed</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Maximum rank achieved! 💎
                  </div>
                );
              })()}
            </div>
          </div>
        )}

      {/* Profile Content */}
      <Tabs defaultValue="collections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="collections">
            My Collections ({userCollections.length})
          </TabsTrigger>
          <TabsTrigger value="nfts">
            My NFTs ({nfts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="space-y-6">
          <SearchFilterBar
            filters={collectionFilters}
            onFiltersChange={setCollectionFilters}
            showListingFilter={false}
            showSourceFilter={isOwnProfile}
            showPriceFilters={true}
            showRoyaltyFilters={true}
            placeholder="Search collections..."
            categories={['Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Utility', 'Other']}
          />

          {collectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCollections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCollections.map((collection) => (
                 <CollectionCard
                   key={collection.id}
                   collection={{
                     id: collection.id,
                     name: collection.name,
                     image_url: '/placeholder.svg',
                     creator_address_masked: collection.creator_address || '',
                     mint_price: collection.mint_price,
                     items_redeemed: 0,
                     verified: false,
                     description: collection.description
                   }}
                   onNavigate={() => setNavContext({ 
                     type: 'collection', 
                     items: filteredCollections.map(c => c.id), 
                     source: 'profile',
                     tab: 'collections'
                   })}
                 />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {collectionFilters.searchQuery || collectionFilters.source !== 'all'
                    ? 'No collections match your filters'
                    : isOwnProfile
                    ? 'You haven\'t created any collections yet'
                    : 'This user hasn\'t created any collections yet'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nfts" className="space-y-6">
          <SearchFilterBar
            filters={nftFilters}
            onFiltersChange={setNftFilters}
            showListingFilter={isOwnProfile}
            showSourceFilter={isOwnProfile}
            showPriceFilters={true}
            showRoyaltyFilters={false}
            placeholder="Search NFTs..."
            categories={['Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Utility', 'Other']}
          />

          {nftsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNFTs.map((nft) => (
                 <NFTCard
                   key={nft.id}
                   nft={{
                     id: nft.id,
                     name: nft.name,
                     image_url: '/placeholder.svg',
                     owner_address: targetWallet || '',
                     mint_address: nft.id,
                     creator_address: targetWallet || '',
                     price: nft.price,
                     is_listed: nft.is_listed || false,
                     collection_id: undefined,
                     description: nft.description,
                     attributes: undefined,
                     collections: undefined
                   }}
                   showOwnerInfo={false}
                   onNavigate={() => setNavContext({ 
                     type: 'nft', 
                     items: filteredNFTs.map(n => n.id), 
                     source: 'profile',
                     tab: 'nfts'
                   })}
                 />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {nftFilters.searchQuery || nftFilters.source !== 'all' || nftFilters.listing !== 'all'
                    ? 'No NFTs match your filters'
                    : isOwnProfile
                    ? 'You don\'t own any NFTs yet'
                    : 'This user doesn\'t own any NFTs yet'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
