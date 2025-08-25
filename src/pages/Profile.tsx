import { useNavigate } from 'react-router-dom';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useCollections } from '@/hooks/useCollections';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Edit, Camera, Trophy, Coins, Star, Users, Info, Grid3x3, User, Trash2, Eye, Plus } from 'lucide-react';
import { ImageLazyLoad } from '@/components/ImageLazyLoad';
import { useCollectionLikes } from '@/hooks/useCollectionLikes';
import { ExportTradingDataButton } from '@/components/ExportTradingDataButton';
import { useGamifiedProfile } from "@/hooks/useGamifiedProfile";
import { useUserNFTs } from "@/hooks/useUserNFTs";
import { useRealtimeCreatorStats } from "@/hooks/useRealtimeCreatorStats";
import { useCreatorFollows } from "@/hooks/useCreatorFollows";
import { FollowedAuthorCard } from "@/components/FollowedAuthorCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLikedNFTs } from '@/hooks/useLikedNFTs';
import { useLikedCollections } from '@/hooks/useLikedCollections';
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PfpPickerDialog } from '@/components/PfpPickerDialog';
import { BannerPickerDialog } from '@/components/BannerPickerDialog';
import { NicknameEditDialog } from '@/components/NicknameEditDialog';
import { BioEditDialog } from '@/components/BioEditDialog';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { toast } from 'sonner';
import profileBanner from '@/assets/profile-banner.jpg';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/integrations/supabase/client';
import { NFTCard } from '@/components/NFTCard';
import { EditNFTDialog } from '@/components/EditNFTDialog';
import { useBurnNFT } from '@/hooks/useBurnNFT';
import { useDeleteCollection } from '@/hooks/useDeleteCollection';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function Profile() {
  const navigate = useNavigate();
  const { publicKey, connected, connect } = useSolanaWallet();
  const { collections, loading, refreshCollections } = useCollections();
  const { likedCollections, toggleLike, isLiked } = useCollectionLikes();
  const { profile, setNickname, setBio, setPFP, setBanner, getRankBadge, getRankColor, nicknameLoading, bioLoading, pfpLoading } = useGamifiedProfile();
  const { nfts, refreshNFTs } = useUserNFTs();
  const { likedNFTs, loading: likedNFTsLoading } = useLikedNFTs();
  const { likedCollections: likedCollectionsData, loading: likedCollectionsLoading } = useLikedCollections();
  const { toggleFollow, isFollowing, followedCreators } = useCreatorFollows();
  const { burning, burnNFT } = useBurnNFT();
  const { deleting, deleteCollection } = useDeleteCollection();
  
  const scrollPositionRef = useRef<number>(0);
  
  // Save and restore scroll position instantly with useLayoutEffect
  useLayoutEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('profile-scroll-position');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      sessionStorage.removeItem('profile-scroll-position');
    }
  }, []);

  // Save scroll position before navigating to collection
  const handleCollectionClick = (collectionId: string) => {
    sessionStorage.setItem('profile-scroll-position', window.scrollY.toString());
    navigate(`/collection/${collectionId}`);
  };
  
  const { getCreatorFollowerCount, getCreatorNFTLikeCount } = useRealtimeCreatorStats(
    profile?.wallet_address ? [profile.wallet_address, ...followedCreators] : followedCreators
  );
  const profileLikes = profile?.wallet_address ? getCreatorFollowerCount(profile.wallet_address) : 0;
  const nftLikes = profile?.wallet_address ? getCreatorNFTLikeCount(profile.wallet_address) : 0;
  
  const [pfpDialogOpen, setPfpDialogOpen] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);
  const [followedProfiles, setFollowedProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [editDialogNFTId, setEditDialogNFTId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    loading?: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Fetch profile details for followed creators
  useEffect(() => {
    const fetchFollowedProfiles = async () => {
      if (followedCreators.length === 0) {
        setFollowedProfiles([]);
        return;
      }

      setLoadingProfiles(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('wallet_address, nickname, bio, profile_image_url')
          .in('wallet_address', followedCreators);

        if (error) throw error;
        setFollowedProfiles(data || []);
      } catch (error) {
        console.error('Error fetching followed profiles:', error);
        setFollowedProfiles([]);
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchFollowedProfiles();
  }, [followedCreators]);

  const renderCollectionsGrid = () => {
    if (collections.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No collections created yet</p>
          <Button onClick={() => navigate('/mint')}>Create Your First Collection</Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Card 
            key={collection.id}
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
            onClick={() => handleCollectionClick(collection.id)}
          >
            <div className="aspect-square relative overflow-hidden group/image">
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
                  toggleLike(collection.id);
                }}
                className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 z-20 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isLiked(collection.id)
                    ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400'
                    : 'bg-black/50 text-white hover:bg-black/70 focus-visible:ring-primary'
                }`}
                title={isLiked(collection.id) ? "Unlike Collection" : "Like Collection"}
                aria-label={isLiked(collection.id) ? "Unlike this collection" : "Like this collection"}
              >
                <Heart className={`w-4 h-4 ${isLiked(collection.id) ? 'fill-current' : ''}`} />
              </button>

              {/* Status badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                {collection.is_live && (
                  <Badge variant="secondary" className="bg-green-500/90 text-white">
                    Live
                  </Badge>
                )}
                {collection.verified && (
                  <Badge variant="secondary" className="bg-blue-500/90 text-white">
                    Verified
                  </Badge>
                )}
              </div>

              {/* Overlay Actions - Fixed hover behavior */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                <div className="flex flex-wrap items-center justify-center gap-1 px-2 pointer-events-auto">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCollectionClick(collection.id);
                    }}
                    className="bg-white/90 text-black hover:bg-white"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">View</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCollectionClick(collection.id);
                    }}
                    className="bg-white/90 text-black hover:bg-white hover:!text-black border-white/20 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
                    title="Edit Collection"
                    aria-label="Edit Collection"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">Edit</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/mint/nft?collection=${collection.id}`);
                    }}
                    className="bg-primary/90 text-white hover:bg-primary hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
                    title="Mint NFT"
                    aria-label="Mint new NFT in this collection"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">Mint</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDialog({
                        open: true,
                        title: 'Delete Collection',
                        description: `Are you sure you want to delete "${collection.name}"? This action cannot be undone and will permanently remove the collection.`,
                        onConfirm: async () => {
                          // CRITICAL: This deletion flow must NEVER cause UI flickering or scroll jumps
                          // Collections grid must remain mounted throughout the entire process
                          setConfirmDialog(prev => ({ ...prev, loading: true }));
                          
                          const res = await deleteCollection(collection.id, collection.name);
                          if (res.success) {
                            await refreshCollections();
                            
                            // Restore scroll position after a brief delay to ensure DOM is ready
                            const savedPosition = sessionStorage.getItem('deletion-scroll-position');
                            if (savedPosition) {
                              requestAnimationFrame(() => {
                                console.log('🔄 Restoring scroll position after deletion:', savedPosition);
                                window.scrollTo(0, parseInt(savedPosition));
                                sessionStorage.removeItem('deletion-scroll-position');
                              });
                            }
                          }
                          setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
                        }
                      });
                    }}
                    className="bg-red-500/90 text-white hover:bg-red-500 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 transition-all duration-200"
                    title="Burn Collection"
                    aria-label="Burn/Delete this collection permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">Burn</span>
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {collection.name}
              </h3>
              
              {collection.site_description && (
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {collection.site_description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {collection.items_redeemed}/{collection.max_supply || '∞'} minted
                </span>
                {collection.mint_price > 0 && (
                  <span className="font-medium">
                    {collection.mint_price} SOL
                  </span>
                )}
              </div>
            </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect your Solana wallet to view and manage your NFT collections, track your creations, and engage with the community.
            </p>
          </div>

          {/* Connect Wallet Card */}
          <div className="max-w-md mx-auto mb-16">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Solana wallet to access your profile and manage your NFT collections.
                </p>
                <Button 
                  onClick={() => connect()}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card/30 border-primary/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Manage Collections</h3>
                <p className="text-sm text-muted-foreground">
                  View and organize all your created NFT collections in one place.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-primary/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Profile Customization</h3>
                <p className="text-sm text-muted-foreground">
                  Customize your profile with banners, avatars, and personal information.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-primary/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Badge variant="outline" className="border-primary/20 text-primary">
                    <span className="text-xs">LIVE</span>
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">Track Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your collection metrics, likes, and community engagement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex items-center gap-3">
          <ExportTradingDataButton variant="outline" size="sm" />
          <Button onClick={() => navigate('/mint')}>Create New Collection</Button>
        </div>
      </div>

      {/* Enhanced Profile Section */}
      <div className="mb-8">
        {/* Universal Banner */}
        <AspectRatio ratio={4 / 1} className="relative w-full rounded-lg overflow-hidden group">
          <ImageLazyLoad
            src={profile?.banner_image_url || profileBanner}
            alt="Profile Banner"
            className="absolute inset-0 w-full h-full object-cover"
            fallbackSrc="/placeholder.svg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          
          {/* Banner Edit Button */}
          <button
            onClick={() => setBannerDialogOpen(true)}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/80 border hover:bg-muted transition opacity-0 group-hover:opacity-100"
            aria-label="Change banner"
            title="Change banner (visible on profile & marketplace)"
          >
            <Camera className="w-5 h-5" />
          </button>
        </AspectRatio>

        {/* Profile Info */}
        <div className="flex items-start justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="relative -mt-16">
              <Avatar className="w-40 h-40 rounded-full border-4 border-background bg-card">
                <AvatarImage src={profile?.profile_image_url || '/placeholder.svg'} alt="Avatar" />
                <AvatarFallback className="text-3xl font-bold">
                  {profile?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setPfpDialogOpen(true)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-background/80 border hover:bg-muted transition"
                aria-label="Change profile picture"
                title="Change profile picture"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{profile?.nickname || 'Set Nickname'}</h2>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setNicknameDialogOpen(true)}
                      className="p-1 h-auto"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <button
                      onClick={() => profile?.wallet_address && toggleFollow(profile.wallet_address)}
                      className="transition-colors duration-200"
                      disabled={!profile?.wallet_address}
                      aria-label={profile?.wallet_address && isFollowing(profile.wallet_address) ? 'Unfollow' : 'Follow'}
                      title={profile?.wallet_address && isFollowing(profile.wallet_address) ? 'Unfollow' : 'Follow'}
                    >
                      <Heart className={`w-5 h-5 ${
                        profile?.wallet_address && isFollowing(profile.wallet_address)
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground hover:text-red-500'
                      }`} />
                    </button>
                  </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {publicKey ? `${publicKey.slice(0,4)}...${publicKey.slice(-4)}` : ''}
              </p>

              {/* Bio Section */}
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-sm italic">
                    {profile?.bio || 'Add your bio (100 characters max)'}
                  </p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setBioDialogOpen(true)}
                    className="p-1 h-auto"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-secondary/5 border-secondary/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center">
                        <span className="text-2xl font-bold text-foreground mr-1">
                          {profile?.profile_rank ? getRankBadge(profile.profile_rank).icon : '🌟'}
                        </span>
                        <span className="text-2xl font-bold text-foreground">
                          {profile?.profile_rank ? getRankBadge(profile.profile_rank).text : 'Starter'}
                        </span>
                        <span className="text-2xl font-bold text-foreground mx-2">/</span>
                        <span className="text-2xl font-bold text-foreground">
                          {profile?.trade_count || 0}
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
              <div className="flex items-center justify-center mb-2">
                <Grid3x3 className="w-5 h-5 text-primary mr-1" />
                <span className="text-2xl font-bold text-primary">
                  {nfts?.length || 0} / {collections?.length || 0}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">NFTs / Collections</p>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 text-center">
               <div className="flex items-center justify-center mb-2">
                 <Heart className="w-5 h-5 text-destructive mr-1" />
                 <span className="text-2xl font-bold text-foreground">
                   {profileLikes} / {nftLikes}
                 </span>
               </div>
               <p className="text-sm text-muted-foreground">Profile Likes / NFT Likes</p>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Content Tabs */}
      <Tabs defaultValue="collections" className="w-full">
        <div className="w-full overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" >
          <TabsList className="flex h-12 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max md:mx-auto md:justify-center">
            <TabsTrigger 
              value="collections" 
              className="flex-shrink-0 whitespace-nowrap px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-all"
            >
              My Collections
            </TabsTrigger>
            <TabsTrigger 
              value="nfts"
              className="flex-shrink-0 whitespace-nowrap px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-all"
            >
              My NFTs
            </TabsTrigger>
            <TabsTrigger 
              value="liked-collections"
              className="flex-shrink-0 whitespace-nowrap px-2 md:px-4 py-2 text-xs md:text-sm font-medium transition-all"
            >
              Collections I Like
            </TabsTrigger>
            <TabsTrigger 
              value="liked-nfts"
              className="flex-shrink-0 whitespace-nowrap px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-all"
            >
              NFTs I Like
            </TabsTrigger>
            <TabsTrigger 
              value="following"
              className="flex-shrink-0 whitespace-nowrap px-2 md:px-4 py-2 text-xs md:text-sm font-medium transition-all"
            >
              Authors I Follow
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="collections" className="mt-6">
          {loading ? (
            <p>Loading collections...</p>
          ) : (
            renderCollectionsGrid()
          )}
        </TabsContent>

        <TabsContent value="nfts" className="mt-6">
          {nfts && nfts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nfts.map((nft) => {
                const allNFTIds = nfts.map(n => n.id);
                const queryString = `from=profile&tab=nfts&nav=${encodeURIComponent(JSON.stringify(allNFTIds))}`;
                
                return (
                  <NFTCard
                    key={nft.id}
                    nft={{
                      id: nft.id,
                      name: nft.name,
                      image_url: nft.image_url || '',
                      price: nft.price,
                      owner_address: nft.owner_address,
                      creator_address: nft.creator_address,
                      mint_address: nft.mint_address,
                      is_listed: nft.is_listed || false,
                      collection_id: nft.collection_id,
                      description: nft.description,
                    }}
                    navigationQuery={queryString}
                    overlayActions={[
                      {
                        label: 'Edit',
                        icon: <Edit className="h-4 w-4" />,
                        onClick: () => setEditDialogNFTId(nft.id)
                      },
                      {
                        label: 'Burn',
                        icon: <Trash2 className="h-4 w-4" />,
                        variant: 'destructive' as const,
                        disabled: burning,
                        onClick: async () => {
                          if (!nft.mint_address) {
                            toast.error('Mint address missing for this NFT');
                            return;
                          }
                          setConfirmDialog({
                            open: true,
                            title: 'Burn NFT',
                            description: `Are you sure you want to burn "${nft.name}"? This action cannot be undone and will permanently destroy the NFT.`,
                            onConfirm: async () => {
                              setConfirmDialog(prev => ({ ...prev, loading: true }));
                              const res = await burnNFT(nft.id, nft.mint_address);
                              if (res.success) refreshNFTs();
                              setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
                            }
                          });
                        }
                      }
                    ]}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No NFTs found</p>
              <Button onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>
            </div>
          )}
          
          {/* Edit NFT Dialog */}
          {editDialogNFTId && nfts && (
            <EditNFTDialog 
              nft={nfts.find(n => n.id === editDialogNFTId)!} 
              onUpdate={() => {
                refreshNFTs();
                setEditDialogNFTId(null);
              }}
              open={true}
              onOpenChange={(open) => !open && setEditDialogNFTId(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="liked-collections" className="mt-6">
          {likedCollectionsLoading ? (
            <p>Loading liked collections...</p>
          ) : likedCollectionsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedCollectionsData.map((collection) => (
                <Card 
                  key={collection.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                  onClick={() => handleCollectionClick(collection.id)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <ImageLazyLoad
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackSrc="/placeholder.svg"
                    />
                    
                    {/* Heart button for unliking collections */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(collection.id);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full transition-all duration-200 bg-red-500 text-white hover:bg-red-600 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                      title="Unlike Collection"
                      aria-label="Unlike this collection"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    {/* Status badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {collection.is_live && (
                        <Badge variant="secondary" className="bg-green-500/90 text-white">
                          Live
                        </Badge>
                      )}
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
                    
                    {collection.site_description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {collection.site_description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {collection.items_redeemed}/{collection.max_supply || '∞'} minted
                        </span>
                        {collection.mint_price > 0 && (
                          <span className="font-medium">
                            {collection.mint_price} SOL
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Liked on {new Date(collection.liked_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No liked collections yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Explore the marketplace and like collections to see them here
              </p>
              <Button onClick={() => navigate('/marketplace?tab=collections')}>Browse Collections</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked-nfts" className="mt-6">
          {likedNFTsLoading ? (
            <p>Loading liked NFTs...</p>
          ) : likedNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedNFTs.map((nft) => (
                <Card 
                  key={nft.id} 
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/nft/${nft.id}`)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <ImageLazyLoad
                      src={nft.image_url}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackSrc="/placeholder.svg"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors truncate">
                      {nft.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      Creator: {nft.creator_address.slice(0, 8)}...{nft.creator_address.slice(-8)}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Liked on {new Date(nft.liked_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No liked NFTs yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Explore the marketplace and like NFTs to see them here
              </p>
              <Button onClick={() => navigate('/marketplace')}>Browse NFTs</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          {loadingProfiles ? (
            <p>Loading followed profiles...</p>
          ) : followedProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {followedProfiles.map((followedProfile) => {
                const followerCount = getCreatorFollowerCount(followedProfile.wallet_address);
                return (
                  <FollowedAuthorCard
                    key={followedProfile.wallet_address}
                    wallet_address={followedProfile.wallet_address}
                    nickname={followedProfile.nickname}
                    bio={followedProfile.bio}
                    profile_image_url={followedProfile.profile_image_url}
                    followerCount={followerCount}
                    onClick={(walletAddress) => navigate(`/profile/${walletAddress}`)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">You haven't liked any profiles yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Like profiles to see them here - including your own!
              </p>
              <Button onClick={() => navigate('/marketplace?tab=creators')}>Explore Creators</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Bio Edit Dialog */}
      <BioEditDialog
        open={bioDialogOpen}
        onOpenChange={setBioDialogOpen}
        profile={profile}
        loading={bioLoading}
        currentBio={profile?.bio}
        onConfirm={async (bio) => {
          const ok = await setBio(bio, 'simulated_transaction_signature');
          if (ok) {
            toast.success('Bio updated successfully!');
          }
          return ok;
        }}
      />

      {/* Nickname Edit Dialog */}
      <NicknameEditDialog
        open={nicknameDialogOpen}
        onOpenChange={setNicknameDialogOpen}
        profile={profile}
        loading={nicknameLoading}
        currentNickname={profile?.nickname}
        onConfirm={async (nickname) => {
          const ok = await setNickname(nickname, 'simulated_transaction_signature');
          if (ok) {
            toast.success('Nickname updated successfully!');
          }
          return ok;
        }}
      />

      {/* PFP Selection Dialog */}
      <PfpPickerDialog
        open={pfpDialogOpen}
        onOpenChange={setPfpDialogOpen}
        profile={profile}
        nfts={nfts}
        loading={pfpLoading}
        isFirstChange={!profile?.profile_image_url}
        onConfirm={async (mint) => {
          const ok = await setPFP(mint, 'simulated_transaction_signature');
          if (ok) {
            toast.success('Profile picture updated!');
          }
          return ok;
        }}
      />

      {/* Banner Selection Dialog */}
      <BannerPickerDialog
        open={bannerDialogOpen}
        onOpenChange={setBannerDialogOpen}
        profile={profile}
        loading={bioLoading} // Reusing bio loading state
        isFirstChange={false} // Banner changes are never free
          onConfirm={async (file) => {
            const ok = await setBanner(file);
            return ok;
          }}
        />
        
        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText="Confirm"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={confirmDialog.onConfirm}
          loading={confirmDialog.loading}
        />
      </div>
    );
  }
