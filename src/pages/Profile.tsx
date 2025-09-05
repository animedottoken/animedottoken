
import defaultBanner from '@/assets/default-profile-banner.jpg';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, CheckCircle, Star, Info, Share, Copy, UserPlus, UserMinus, Layers, Image, Camera, Edit2, User, LogIn, LogOut, Shield, Settings, Mail, ChevronDown } from 'lucide-react';
import { NFTCard } from '@/components/NFTCard';
import { CollectionCard } from '@/components/CollectionCard';
import { SearchFilterBar, FilterState } from '@/components/SearchFilterBar';
import { useProfileFilters } from '@/contexts/ProfileFiltersContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useUserNFTs } from '@/hooks/useUserNFTs';
import { useCollections } from '@/hooks/useCollections';
import { useLikedNFTs } from '@/hooks/useLikedNFTs';
import { useLikedCollections } from '@/hooks/useLikedCollections';
import { useCreatorFollowsByUser } from '@/hooks/useCreatorFollowsByUser';
import { useNFTLikeCounts, useCollectionLikeCounts } from '@/hooks/useLikeCounts';
import { useRealtimeNFTStats } from '@/hooks/useRealtimeNFTStats';
import { useProfileLikeStats } from '@/hooks/useProfileLikeStats';
import { useFilteredNFTs, useFilteredCollections } from "@/hooks/useFilteredData";
import { useRealtimeCreatorStatsByUser } from '@/hooks/useRealtimeCreatorStatsByUser';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { setNavContext } from "@/lib/navContext";
import { BioEditDialog } from '@/components/BioEditDialog';
import { NicknameEditDialog } from '@/components/NicknameEditDialog';
import { PfpPickerDialog } from '@/components/PfpPickerDialog';
import { BannerPickerDialog } from '@/components/BannerPickerDialog';
import { useGamifiedProfile } from '@/hooks/useGamifiedProfile';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';
import { NewsletterManagement } from '@/components/NewsletterManagement';
import { StatusDots } from '@/components/StatusDots';
import { MultiWalletSection } from '@/components/MultiWalletSection';
import { AutoPrimaryWalletPrompt } from '@/components/AutoPrimaryWalletPrompt';
import { useAutoPrimaryWallet } from '@/hooks/useAutoPrimaryWallet';
import { SecuritySettingsDialog } from '@/components/SecuritySettingsDialog';
import SocialActionWrapper from '@/components/SocialActionWrapper';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { ComingSoonFeature } from '@/components/ComingSoonFeature';

const Profile = () => {
  const { wallet } = useParams();
  const { publicKey, connected, connectPaymentWallet, disconnect, connecting, walletName } = useSolanaWallet();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showRankInfo, setShowRankInfo] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  
  // Newsletter banner state
  const [newsletterBanner, setNewsletterBanner] = useState<{ type: 'confirmed' | 'unsubscribed' | null; show: boolean }>({ type: null, show: false });
  
  // Collapsible sections state with localStorage persistence
  const [collectionsOpen, setCollectionsOpen] = useState(() => {
    const saved = localStorage.getItem('profile-collections-open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [nftsOpen, setNftsOpen] = useState(() => {
    const saved = localStorage.getItem('profile-nfts-open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('profile-collections-open', JSON.stringify(collectionsOpen));
  }, [collectionsOpen]);

  useEffect(() => {
    localStorage.setItem('profile-nfts-open', JSON.stringify(nftsOpen));
  }, [nftsOpen]);

  // Check for newsletter query parameters and show both toast and banner
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newsletter = params.get('newsletter');
    
    if (newsletter === 'confirmed') {
      toast({
        title: "Newsletter confirmed!",
        description: "You have successfully subscribed to our newsletter.",
      });
      setNewsletterBanner({ type: 'confirmed', show: true });
      // Clear the query parameter to avoid showing toast again
      navigate(location.pathname, { replace: true });
    } else if (newsletter === 'unsubscribed') {
      toast({
        title: "Unsubscribed",
        description: "You have been successfully unsubscribed from our newsletter.",
      });
      setNewsletterBanner({ type: 'unsubscribed', show: true });
      // Clear the query parameter to avoid showing toast again
      navigate(location.pathname, { replace: true });
    }
  }, [location, toast, navigate]);
  
  // Auto primary wallet functionality
  const { showPrimaryPrompt, handleSetAsPrimary, handleDismiss, connectedWallet } = useAutoPrimaryWallet();
  
  // Environment context
  const { canUseFeature } = useEnvironment();
  
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
  const { followedCreators, isFollowingUserId, toggleFollowByUserId, loading: followLoading } = useCreatorFollowsByUser();
  const { getLikeCount: getCollectionLikeCount } = useCollectionLikeCounts();
  
  // Get like stats for this profile by user_id
  const { nft_likes_count, collection_likes_count, total_likes_count } = useProfileLikeStats(profile?.user_id || null);
  
  // Get all NFT IDs for real-time stats
  const allNFTIds = useMemo(() => {
    const userNFTIds = nfts.map(nft => nft.id);
    const likedNFTIds = likedNFTs.map(nft => nft.id);
    return [...new Set([...userNFTIds, ...likedNFTIds])];
  }, [nfts, likedNFTs]);
  
  // Use real-time NFT stats instead of the old static version
  const { getNFTLikeCount } = useRealtimeNFTStats(allNFTIds);
  
  // Real-time creator stats - use user-based stats if profile has user_id
  const { getCreatorFollowerCount, getCreatorFollowingCount, getCreatorTotalLikeCount } = useRealtimeCreatorStatsByUser(
    profile?.user_id ? [profile.user_id] : []
  );

  // Get filters and ranges from context
  const { filters: combinedFilters, setFilters: setCombinedFilters, currentPriceRange, currentRoyaltyRange, setCurrentPriceRange, setCurrentRoyaltyRange } = useProfileFilters();
  const isMobile = useIsMobile();

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
        toast({
          title: "Error",
          description: "Failed to update nickname",
          variant: "destructive",
        });
        return false;
      }
      await fetchProfile();
      toast({
        title: "Success",
        description: isFirstChange ? 'Nickname set successfully!' : 'Nickname updated successfully!',
      });
      return true;
    } catch (error) {
      console.error('Error updating nickname:', error);
      toast({
        title: "Error", 
        description: "Failed to update nickname",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleBioConfirm = async (bio: string) => {
    try {
      if (hasWallet) {
        const success = await setBio(bio);
        if (!success) {
          toast({
            title: "Error",
            description: "Failed to update bio",
            variant: "destructive",
          });
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
      toast({
        title: "Success",
        description: "Bio updated successfully!",
      });
      return true;
    } catch (error) {
      console.error('Error updating bio:', error);
      toast({
        title: "Error",
        description: "Failed to update bio",
        variant: "destructive",
      });
      return false;
    }
  };

  const handlePfpConfirm = async (nftMintAddress: string) => {
    try {
      await setPFP(nftMintAddress, 'dummy-tx-signature');
      await fetchProfile();
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
      return true;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture", 
        variant: "destructive",
      });
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
        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Avatar update error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Copied to clipboard!",
      });
    } catch (err) {
      toast({
        title: "Error", 
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
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
            toast({
              title: "Error",
              description: "Failed to load profile",
              variant: "destructive",
            });
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
            toast({
              title: "Error",
              description: "Failed to load profile",
              variant: "destructive",
            });
            return;
          }
          
          setProfile(data || null);
        } else if (publicKey && !user && !wallet) {
          // Fetch profile using just the connected wallet's public key
          const { data, error } = await supabase.functions.invoke('get-profile', {
            body: { wallet_address: publicKey }
          });
          
          if (error) {
            console.error('Error fetching profile:', error);
            toast({
              title: "Error",
              description: "Failed to load profile",
              variant: "destructive",
            });
            return;
          }
          
          setProfile(data || null);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile", 
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetWallet, user, wallet, publicKey]);

  // Get collections created by this user
  const userCollections = useMemo(() => {
    // If viewing own profile (no wallet param), show all user's collections
    // If viewing another user's profile, filter by their wallet
    if (isOwnProfile && !targetWallet) {
      return collections.filter(collection => collection.is_active);
    }
    return collections.filter(collection => 
      collection.creator_address === targetWallet && collection.is_active
    );
  }, [collections, targetWallet, isOwnProfile]);

  // Get NFTs and Collections from liked creators - need to map wallet addresses to user IDs
  const nftsFromLikedCreators = useMemo(() => {
    // Since followedCreators contains user IDs but NFTs have creator_address (wallet), 
    // this filtering won't work until we have a mapping. For now, return empty array.
    return [];
  }, [nfts, followedCreators]);

  const collectionsFromLikedCreators = useMemo(() => {
    // Since followedCreators contains user IDs but collections have creator_address (wallet),
    // this filtering won't work until we have a mapping. For now, return empty array.
    return [];
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

  // Create lookup maps for real data
  const nftsById = useMemo(() => {
    const map = new Map();
    nfts.forEach(nft => map.set(nft.id, nft));
    return map;
  }, [nfts]);

  const collectionsById = useMemo(() => {
    const map = new Map();
    userCollections.forEach(collection => map.set(collection.id, collection));
    return map;
  }, [userCollections]);

  // Filter by type for the combined view
  const filteredCombinedNFTs = combinedFilters.type === 'collections' ? [] : filteredNFTs;
  const filteredCombinedCollections = combinedFilters.type === 'nfts' ? [] : filteredCollections;

  // Compute current price and royalty ranges from filtered data
  const computedPriceRange = useMemo(() => {
    const allPrices: number[] = [];
    
    // Get prices from filtered NFTs (treat undefined as 0)
    filteredCombinedNFTs.forEach(nft => {
      allPrices.push(nft.price || 0);
    });
    
    // Get mint prices from filtered collections (treat undefined as 0)
    filteredCombinedCollections.forEach(collection => {
      allPrices.push(collection.mint_price || 0);
    });
    
    if (allPrices.length === 0) return undefined;
    
    return {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices)
    };
  }, [filteredCombinedNFTs, filteredCombinedCollections]);

  const computedRoyaltyRange = useMemo(() => {
    const allRoyalties: number[] = [];
    
    // Get royalty percentages from filtered collections (treat undefined as 0)
    filteredCombinedCollections.forEach(collection => {
      allRoyalties.push(collection.royalty_percentage || 0);
    });
    
    if (allRoyalties.length === 0) return undefined;
    
    return {
      min: Math.min(...allRoyalties),
      max: Math.max(...allRoyalties)
    };
  }, [filteredCombinedCollections]);

  // Update context with current ranges
  useEffect(() => {
    setCurrentPriceRange(computedPriceRange);
    setCurrentRoyaltyRange(computedRoyaltyRange);
  }, [computedPriceRange, computedRoyaltyRange, setCurrentPriceRange, setCurrentRoyaltyRange]);

  // Check if current user is following this profile - by user_id
  const isFollowingProfile = useMemo(() => {
    return profile?.user_id ? followedCreators.includes(profile.user_id) : false;
  }, [followedCreators, profile?.user_id]);

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
                  {/* Login Status Dot */}
                  <StatusDots 
                    isLoggedIn={!!user} 
                    isWalletConnected={connected} 
                    size="sm"
                    showLogin={true}
                    showWallet={false}
                  />
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
                  {profile?.user_id && (
                    <SocialActionWrapper
                      action={isFollowingProfile ? "unfollow creator" : "follow creator"}
                      onAction={async () => {
                        if (profile?.user_id) {
                          await toggleFollowByUserId(profile.user_id);
                        }
                      }}
                    >
                      <Button
                        variant="secondary"
                        className="gap-2"
                        disabled={followLoading}
                      >
                        {isFollowingProfile ? (
                          <>
                            <UserMinus className="h-4 w-4" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                    </SocialActionWrapper>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(window.location.href)}
                    aria-label="Share profile"
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                  
                  {/* Login/Logout Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={user ? signOut : () => navigate('/auth')}
                    className={`flex items-center gap-2 ${user ? 'hover:bg-primary hover:text-primary-foreground' : ''}`}
                  >
                    {user ? (
                      <>
                        Logout
                        <LogOut className="h-4 w-4 text-destructive" />
                      </>
                    ) : (
                      <>
                        Login
                        <LogIn className="h-4 w-4 text-success" />
                      </>
                    )}
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
                       <StatusDots 
                         isLoggedIn={!!user} 
                         isWalletConnected={connected} 
                         size="sm"
                         showLogin={false}
                         showWallet={true}
                       />
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
                         onClick={hasWallet ? disconnect : connectPaymentWallet}
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{getCreatorFollowerCount(profile?.user_id || '')}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Followers - users who follow this profile (includes self-follows)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{getCreatorFollowingCount(profile?.user_id || '')}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Following - users this profile is following (includes self-follows)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{total_likes_count}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Likes - total likes on this creator's NFTs and collections</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{userCollections.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Collections - number of NFT collections created</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Image className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{nfts.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">NFTs - number of NFTs owned or created</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

      {/* Newsletter Banner */}
      {newsletterBanner.show && (
        <div className={`relative rounded-lg p-4 border ${
          newsletterBanner.type === 'confirmed' 
            ? 'bg-success/10 border-success/20 text-success-foreground' 
            : 'bg-info/10 border-info/20 text-info-foreground'
        }`}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {newsletterBanner.type === 'confirmed' ? '🎉' : '👋'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                {newsletterBanner.type === 'confirmed' 
                  ? 'Newsletter Subscription Confirmed!' 
                  : 'Newsletter Unsubscribed'}
              </h3>
              <p className="text-sm opacity-90">
                {newsletterBanner.type === 'confirmed' 
                  ? 'Thank you for joining the ANIME.TOKEN newsletter! You\'ll now receive updates about the latest NFT drops, community events, and exclusive announcements.' 
                  : 'You have been successfully unsubscribed from our newsletter. We\'re sorry to see you go! You can always subscribe again anytime.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewsletterBanner({ type: null, show: false })}
              className="flex-shrink-0"
            >
              ✕
            </Button>
          </div>
        </div>
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
          {/* Mobile-only SearchFilterBar */}
          {isMobile && (
            <SearchFilterBar
              filters={combinedFilters}
              onFiltersChange={setCombinedFilters}
              showListingFilter={isOwnProfile}
              showSourceFilter={isOwnProfile}
              showTypeFilter={true}
              showPriceFilters={true}
              showRoyaltyFilters={true}
              placeholder="Search..."
              categories={['Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Utility', 'Other']}
              collapsible={true}
              currentPriceRange={currentPriceRange}
              currentRoyaltyRange={currentRoyaltyRange}
            />
          )}

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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Collections ({filteredCombinedCollections.length})</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCollectionsOpen(!collectionsOpen)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          collectionsOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </Button>
                  </div>
                  {collectionsOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredCombinedCollections.map((collection) => {
                        const realCollection = collectionsById.get(collection.id);
                        return (
                          <CollectionCard
                            key={collection.id}
                            collection={{
                              id: collection.id,
                              name: collection.name,
                              image_url: realCollection?.image_url || '/placeholder.svg',
                              creator_address_masked: collection.creator_address || '',
                              mint_price: collection.mint_price,
                              items_redeemed: realCollection?.items_redeemed || 0,
                              verified: realCollection?.verified || false,
                              description: collection.description
                            }}
                            onNavigate={() => setNavContext({ 
                              type: 'collection', 
                              items: filteredCombinedCollections.map(c => c.id), 
                              source: 'profile',
                              tab: 'collections-nfts'
                            })}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* NFTs Section */}
              {filteredCombinedNFTs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">NFTs ({filteredCombinedNFTs.length})</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNftsOpen(!nftsOpen)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          nftsOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </Button>
                  </div>
                  {nftsOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredCombinedNFTs.map((nft) => {
                        const realNFT = nftsById.get(nft.id);
                        return (
                          <NFTCard
                            key={nft.id}
                            nft={{
                              id: nft.id,
                              name: nft.name,
                              image_url: realNFT?.image_url || '/placeholder.svg',
                              owner_address: realNFT?.owner_address || targetWallet || '',
                              mint_address: realNFT?.mint_address || nft.id,
                              creator_address: realNFT?.creator_address || targetWallet || '',
                              price: nft.price,
                              is_listed: nft.is_listed || false,
                              collection_id: realNFT?.collection_id,
                              description: nft.description,
                              attributes: realNFT?.metadata,
                              collections: realNFT?.collection_name ? { name: realNFT.collection_name } : undefined
                            }}
                            likeCount={getNFTLikeCount(nft.id)}
                            showOwnerInfo={false}
                            onNavigate={() => setNavContext({ 
                              type: 'nft', 
                              items: filteredCombinedNFTs.map(n => n.id), 
                              source: 'profile',
                              tab: 'collections-nfts'
                            })}
                          />
                        );
                      })}
                    </div>
                  )}
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
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security & Privacy
                    </span>
                    <SecuritySettingsDialog>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                      </Button>
                    </SecuritySettingsDialog>
                  </CardTitle>
                  <CardDescription>
                    Manage your account security, session preferences, and wallet settings.
                  </CardDescription>
                </CardHeader>
              </Card>
            </section>

            {/* Wallet Management */}
            <MultiWalletSection disabledActions={!canUseFeature('wallet-linking')} />
            
            {/* Newsletter Management */}
            <section>
              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Newsletter
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={undefined}
                      disabled={true}
                      className="flex items-center gap-2"
                      title="Coming soon — stay tuned"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Coming Soon</span>
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Subscribe to receive updates about new features, NFT drops, and community highlights directly in your inbox.
                  </CardDescription>
                </CardHeader>
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
