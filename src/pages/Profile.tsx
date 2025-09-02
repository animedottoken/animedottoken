
import defaultBanner from '@/assets/default-profile-banner.jpg';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, CheckCircle, Star, Info, Share, Copy, UserPlus, UserMinus, Layers, Image, Camera, Edit2, User, LogIn, LogOut, Shield } from 'lucide-react';
import { NFTCard } from '@/components/NFTCard';
import { CollectionCard } from '@/components/CollectionCard';
import { SearchFilterBar, FilterState } from '@/components/SearchFilterBar';
import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
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
import { BioEditDialog } from '@/components/BioEditDialog';
import { NicknameEditDialog } from '@/components/NicknameEditDialog';
import { PfpPickerDialog } from '@/components/PfpPickerDialog';
import { BannerPickerDialog } from '@/components/BannerPickerDialog';
import { useGamifiedProfile } from '@/hooks/useGamifiedProfile';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';
import { StatusDots } from '@/components/StatusDots';
import { MultiWalletSection } from '@/components/MultiWalletSection';
import { AutoPrimaryWalletPrompt } from '@/components/AutoPrimaryWalletPrompt';
import { useAutoPrimaryWallet } from '@/hooks/useAutoPrimaryWallet';
import { SecuritySettingsDialog } from '@/components/SecuritySettingsDialog';

const Profile = () => {
  const { wallet } = useParams();
  const { publicKey, connected, connect, disconnect, connecting, walletName } = useSolanaWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showRankInfo, setShowRankInfo] = useState(false);
  
  // Auto primary wallet functionality
  const { showPrimaryPrompt, handleSetAsPrimary, handleDismiss, connectedWallet } = useAutoPrimaryWallet();
  
  // Edit dialog states
  const [showBioEdit, setShowBioEdit] = useState(false);
  const [showNicknameEdit, setShowNicknameEdit] = useState(false);
  const [showPfpPicker, setShowPfpPicker] = useState(false);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  
  // Use gamified profile hook for editing functionality
  const { 
    userNFTs,
    setNickname,
    setBio,
    setPFP,
    setBanner,
    setAvatar,
    loading: profileLoading
  } = useGamifiedProfile();

  const targetWallet = wallet || null;
  const hasWallet = connected && publicKey;

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

  // Filter states - combine into one for the merged tab
  const [combinedFilters, setCombinedFilters] = useState<FilterState>({
    searchQuery: '',
    source: 'all',
    sortBy: 'newest',
    includeExplicit: false,
    category: 'all',
    minPrice: '',
    maxPrice: '',
    minRoyalty: '',
    maxRoyalty: '',
    listing: 'all',
    type: 'all'
  });

  useEffect(() => {
    // Own profile if viewing own wallet or if no wallet specified and we're authenticated
    setIsOwnProfile((connected && targetWallet === publicKey) || (!wallet && !targetWallet));
  }, [connected, targetWallet, publicKey, wallet]);

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

  const handleNicknameConfirm = async (nickname: string) => {
    try {
      const isFirstChange = !profile?.nickname;
      const success = await setNickname(nickname);
      if (!success) {
        toast.error('Failed to update nickname');
        return false;
      }
      await fetchProfile();
      toast.success(isFirstChange ? 'Nickname set successfully!' : 'Nickname updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating nickname:', error);
      toast.error('Failed to update nickname');
      return false;
    }
  };

  const handleBioConfirm = async (bio: string) => {
    try {
      if (hasWallet) {
        const success = await setBio(bio);
        if (!success) {
          toast.error('Failed to update bio');
          return false;
        }
        await fetchProfile();
      } else {
        // Update auth metadata for users without wallets
        const { error } = await supabase.auth.updateUser({
          data: { bio }
        });
        if (error) throw error;
        
        // Update local profile state
        setProfile(prev => prev ? { ...prev, bio } : null);
      }
      toast.success('Bio updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating bio:', error);
      toast.error('Failed to update bio');
      return false;
    }
  };

  const handlePfpConfirm = async (nftMintAddress: string) => {
    try {
      await setPFP(nftMintAddress, 'dummy-tx-signature');
      await fetchProfile();
      toast.success('Profile picture updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Failed to update profile picture');
      return false;
    }
  };

  const handleBannerConfirm = async (bannerFile: File) => {
    const result = await setBanner(bannerFile);
    if (result) {
      await fetchProfile();
    }
    return result;
  };

  const handleAvatarConfirm = async (file: File) => {
    try {
      const result = await setAvatar(file);
      if (result) {
        await fetchProfile();
        toast.success("Profile picture updated successfully!");
        return true;
      }
      return false;
    } catch (error) {
      console.error('Avatar update error:', error);
      toast.error("Failed to update profile picture");
      return false;
    }
  };

  const fetchProfile = async () => {
    try {
      if (targetWallet) {
        // Fetch profile for other users by wallet address
        const { data, error } = await supabase.functions.invoke('get-profile', {
          body: { wallet_address: targetWallet }
        });
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        setProfile(data || null);
      } else if (user) {
        // Fetch own profile using auth JWT (no wallet parameter)
        const { data, error } = await supabase.functions.invoke('get-profile', {
          body: {}
        });
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        setProfile(data || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
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
      setLoading(true);
      try {
        if (targetWallet) {
          // Fetch profile for other users by wallet address
          const { data, error } = await supabase.functions.invoke('get-profile', {
            body: { wallet_address: targetWallet }
          });
          
          if (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
            return;
          }
          
          setProfile(data || null);
        } else if (user && !wallet) {
          // Fetch own profile using auth JWT (no wallet parameter)
          const { data, error } = await supabase.functions.invoke('get-profile', {
            body: {}
          });
          
          if (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
            return;
          }
          
          setProfile(data || null);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetWallet, user, wallet]);

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
    combinedFilters,
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
    combinedFilters,
    getCollectionLikeCount
  );

  // Filter by type for the combined view
  const filteredCombinedNFTs = combinedFilters.type === 'collections' ? [] : filteredNFTs;
  const filteredCombinedCollections = combinedFilters.type === 'nfts' ? [] : filteredCollections;

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

  // Profile is now always authenticated due to RequireAuth wrapper
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div className="relative aspect-[4/1] rounded-lg overflow-hidden" data-testid="profile-banner">
          <img 
            src={profile?.banner_image_url || defaultBanner} 
            alt="Profile Banner" 
            className="w-full h-full object-cover"
          />
          {isOwnProfile && (
            <div className="absolute top-4 right-4">
              <Button
                variant="secondary" 
                size="icon"
                onClick={() => setShowBannerPicker(true)}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                aria-label="Change banner"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* Profile Info - below banner */}
      <div className="px-6 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start">
          {/* Avatar Column */}
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto sm:mx-0">
            <div className="w-full h-full rounded-full border-4 border-background bg-muted-foreground/20 overflow-hidden" data-testid="profile-avatar">
              {profile?.profile_image_url ? (
                <img 
                  src={profile.profile_image_url} 
                  alt="Profile Picture" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20 text-3xl font-bold text-foreground">
                  {profile?.wallet_address ? profile.wallet_address.slice(0, 2).toUpperCase() : (user?.email?.slice(0, 2).toUpperCase() || 'US')}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowPfpPicker(true)}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 border-2 border-border/50 hover:border-border"
                aria-label="Change profile picture"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Info Column */}
          <div className="space-y-3">
              {/* Name Row with Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground" data-testid="profile-name">
                    {profile?.display_name || profile?.nickname || (user?.email?.split('@')[0] || 'User')}
                  </h1>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowNicknameEdit(true)}
                      className="h-6 w-6 p-0"
                      aria-label="Edit name"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {targetWallet && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleFollow(targetWallet)}
                      disabled={followLoading}
                    >
                      {isFollowing(targetWallet) ? (
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
                  )}
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

                {/* Wallet and Rank */}
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Wallet with copy (for other users) */}
                  {targetWallet && !isOwnProfile && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {targetWallet.slice(0, 4)}...{targetWallet.slice(-4)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0"
                        onClick={() => copyToClipboard(targetWallet)}
                        aria-label="Copy wallet address"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Wallet connection for own profile */}
                  {isOwnProfile && (
                    <div className="flex items-center gap-2">
                      <StatusDots isLoggedIn={!!user} isWalletConnected={connected} />
                      <Badge variant={hasWallet ? "secondary" : "outline"} className="text-xs">
                        {hasWallet && publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'No wallet connected'}
                      </Badge>
                      {walletName && hasWallet && (
                        <Badge variant="secondary" className="text-xs">
                          {walletName}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={hasWallet ? disconnect : connect}
                        disabled={connecting}
                        className={`flex items-center gap-2 ${hasWallet ? 'hover:bg-primary hover:text-primary-foreground' : ''}`}
                      >
                        {connecting ? (
                          'Connecting...'
                        ) : hasWallet ? (
                          <>
                            Disconnect Wallet
                            <LogOut className="h-4 w-4 text-destructive" />
                          </>
                        ) : (
                          <>
                            Connect Wallet
                            <LogIn className="h-4 w-4 text-success" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}

              </div>

              {/* Bio */}
              <div className="flex items-start gap-2">
                {profile?.bio ? (
                  <p className="text-muted-foreground break-words whitespace-normal min-h-[1.25rem] flex-1" data-testid="profile-bio">
                    {profile.bio}
                  </p>
                ) : isOwnProfile ? (
                  <p className="text-muted-foreground/60 text-sm italic flex-1">
                    Add a bio to tell others about yourself. This will also be visible on the ANIME.TOKEN marketplace.
                  </p>
                ) : null}
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowBioEdit(true)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                    aria-label="Edit bio"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

               {/* Compact Stats Row with Icons */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {/* Rank Badge */}
                <div className="flex items-center gap-1">
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
                        className="h-5 w-5 p-0"
                        aria-label="About ranks"
                        data-testid="rank-info-button"
                      >
                        <Info className="h-3 w-3" />
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
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{getCreatorFollowerCount(targetWallet || '')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{getCreatorTotalLikeCount(targetWallet || '')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{userCollections.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Image className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{nfts.length}</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Primary Wallet Prompt - Show only on own profile */}
      {isOwnProfile && showPrimaryPrompt && connectedWallet && (
        <AutoPrimaryWalletPrompt
          walletAddress={connectedWallet}
          onSetAsPrimary={handleSetAsPrimary}
          onDismiss={handleDismiss}
        />
      )}

      {/* Profile Content */}
      <Tabs defaultValue="collections-nfts" className="space-y-6">
        <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="collections-nfts">
            My Collections & NFTs ({userCollections.length + nfts.length})
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="settings">
              Account Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="collections-nfts" className="space-y-6">
          <SearchFilterBar
            filters={combinedFilters}
            onFiltersChange={setCombinedFilters}
            showListingFilter={isOwnProfile}
            showSourceFilter={isOwnProfile}
            showTypeFilter={true}
            showPriceFilters={true}
            showRoyaltyFilters={true}
            placeholder="Search collections and NFTs..."
            categories={['Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Utility', 'Other']}
            collapsible={true}
          />

          {collectionsLoading || nftsLoading ? (
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
          ) : (filteredCombinedCollections.length > 0 || filteredCombinedNFTs.length > 0) ? (
            <div className="space-y-6">
              {/* Collections Section */}
              {filteredCombinedCollections.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Collections ({filteredCombinedCollections.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCombinedCollections.map((collection) => (
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
                           items: filteredCombinedCollections.map(c => c.id), 
                           source: 'profile',
                           tab: 'collections-nfts'
                         })}
                       />
                    ))}
                  </div>
                </div>
              )}

              {/* NFTs Section */}
              {filteredCombinedNFTs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">NFTs ({filteredCombinedNFTs.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCombinedNFTs.map((nft) => (
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
                           items: filteredCombinedNFTs.map(n => n.id), 
                           source: 'profile',
                           tab: 'collections-nfts'
                         })}
                       />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {combinedFilters.searchQuery || combinedFilters.source !== 'all' || combinedFilters.type !== 'all' || combinedFilters.listing !== 'all'
                    ? 'No items match your filters'
                    : isOwnProfile
                    ? 'You don\'t have any collections or NFTs yet'
                    : 'This user doesn\'t have any collections or NFTs yet'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="settings" className="space-y-6">
            {/* Security Settings */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Privacy
                  </CardTitle>
                  <CardDescription>
                    Manage your account security, session preferences, and wallet settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecuritySettingsDialog>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Open Security Settings
                    </Button>
                  </SecuritySettingsDialog>
                </CardContent>
              </Card>
            </section>

            {/* Wallet Management */}
            <MultiWalletSection />
            
            {/* Stay Updated Section */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Stay Updated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <NewsletterSubscribe />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Dialogs */}
      {isOwnProfile && (
        <>
          <BioEditDialog
            open={showBioEdit}
            onOpenChange={setShowBioEdit}
            profile={profile}
            onConfirm={handleBioConfirm}
            loading={profileLoading}
            currentBio={profile?.bio || ''}
          />
          
          <NicknameEditDialog
            open={showNicknameEdit}
            onOpenChange={setShowNicknameEdit}
            profile={profile}
            onConfirm={handleNicknameConfirm}
            loading={profileLoading}
            currentNickname={profile?.nickname || ''}
          />
          
          <PfpPickerDialog
            open={showPfpPicker}
            onOpenChange={setShowPfpPicker}
            profile={profile}
            onConfirmUpload={handleAvatarConfirm}
            loading={profileLoading}
            isFirstChange={!profile?.profile_image_url}
          />
          
          <BannerPickerDialog
            open={showBannerPicker}
            onOpenChange={setShowBannerPicker}
            profile={profile}
            onConfirm={handleBannerConfirm}
            loading={profileLoading}
            isFirstChange={!profile?.banner_image_url}
          />
        </>
      )}
    </div>
  );
};

export default Profile;
