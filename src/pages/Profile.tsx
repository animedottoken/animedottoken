import { useNavigate } from 'react-router-dom';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useCollections } from '@/hooks/useCollections';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Edit, Camera, Trophy, Coins, Star, Users, Info, Grid3x3 } from 'lucide-react';
import { ImageLazyLoad } from '@/components/ImageLazyLoad';
import { useCollectionLikes } from '@/hooks/useCollectionLikes';
import { ExportTradingDataButton } from '@/components/ExportTradingDataButton';
import { useGamifiedProfile } from '@/hooks/useGamifiedProfile';
import { useUserNFTs } from '@/hooks/useUserNFTs';
import { useRealtimeCreatorStats } from '@/hooks/useRealtimeCreatorStats';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PfpPickerDialog } from '@/components/PfpPickerDialog';
import { BannerPickerDialog } from '@/components/BannerPickerDialog';
import { NicknameEditDialog } from '@/components/NicknameEditDialog';
import { BioEditDialog } from '@/components/BioEditDialog';
import { useState } from 'react';
import { toast } from 'sonner';
import profileBanner from '@/assets/profile-banner.jpg';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function Profile() {
  const navigate = useNavigate();
  const { publicKey, connected, connect } = useSolanaWallet();
  const { collections, loading, refreshCollections } = useCollections();
  const { likedCollections, toggleLike, isLiked } = useCollectionLikes();
  const { profile, setNickname, setBio, setPFP, setBanner, getRankBadge, getRankColor, nicknameLoading, bioLoading, pfpLoading } = useGamifiedProfile();
  const { nfts } = useUserNFTs();
  
  const { getCreatorFollowerCount, getCreatorNFTLikeCount } = useRealtimeCreatorStats(profile?.wallet_address ? [profile.wallet_address] : []);
  const profileLikes = profile?.wallet_address ? getCreatorFollowerCount(profile.wallet_address) : 0;
  const nftLikes = profile?.wallet_address ? getCreatorNFTLikeCount(profile.wallet_address) : 0;
  
  const [pfpDialogOpen, setPfpDialogOpen] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);

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
                  toggleLike(collection.id);
                }}
                className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
                  isLiked(collection.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-black/50 text-white hover:bg-black/70'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked(collection.id) ? 'fill-current' : ''}`} />
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
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-primary bg-transparent text-xs">P</AvatarFallback>
                  </Avatar>
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
                  </div>
                
                {profile?.profile_rank && (
                  <Badge className={getRankBadge(profile.profile_rank).color}>
                    {getRankBadge(profile.profile_rank).text} ⭐
                  </Badge>
                )}
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

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-5 h-5 text-destructive mr-1" />
                <span className="text-2xl font-bold text-foreground">
                  {nftLikes} / {profileLikes}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">NFT Likes / Profile Likes</p>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Content Tabs */}
      <Tabs defaultValue="collections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collections">My Collections</TabsTrigger>
          <TabsTrigger value="nfts">My NFTs</TabsTrigger>
          <TabsTrigger value="liked-nfts">NFTs I Like</TabsTrigger>
          <TabsTrigger value="following">Authors I Follow</TabsTrigger>
        </TabsList>

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
              {nfts.map((nft) => (
                <Card key={nft.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
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
                      {nft.mint_address.slice(0, 8)}...{nft.mint_address.slice(-8)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No NFTs found</p>
              <Button onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked-nfts" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Coming soon - Your liked NFTs will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Coming soon - Authors you follow will appear here</p>
          </div>
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
    </div>
  );
}
