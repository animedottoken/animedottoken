import { useNavigate } from 'react-router-dom';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useCollections } from '@/hooks/useCollections';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Edit, Camera, Trophy, Coins, Star, Users } from 'lucide-react';
import { ImageLazyLoad } from '@/components/ImageLazyLoad';
import { useCollectionLikes } from '@/hooks/useCollectionLikes';
import { ExportTradingDataButton } from '@/components/ExportTradingDataButton';
import { useGamifiedProfile } from '@/hooks/useGamifiedProfile';
import { useUserNFTs } from '@/hooks/useUserNFTs';
import { useRealtimeCreatorStats } from '@/hooks/useRealtimeCreatorStats';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from 'react';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { publicKey, connected, connect } = useSolanaWallet();
  const { collections, loading, refreshCollections } = useCollections();
  const { likedCollections, toggleLike, isLiked } = useCollectionLikes();
  const { profile, setNickname, setBio, setPFP, getRankBadge, getRankColor, nicknameLoading, bioLoading, pfpLoading } = useGamifiedProfile();
  const { nfts } = useUserNFTs();
  
  const { getCreatorFollowerCount, getCreatorNFTLikeCount } = useRealtimeCreatorStats(profile?.wallet_address ? [profile.wallet_address] : []);
  const profileLikes = profile?.wallet_address ? getCreatorFollowerCount(profile.wallet_address) : 0;
  const nftLikes = profile?.wallet_address ? getCreatorNFTLikeCount(profile.wallet_address) : 0;
  
  const [editingNickname, setEditingNickname] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newBio, setNewBio] = useState('');
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [pfpDialogOpen, setPfpDialogOpen] = useState(false);

  const handleNicknameUpdate = async () => {
    if (!newNickname.trim()) {
      toast.error('Please enter a nickname');
      return;
    }
    
    const success = await setNickname(newNickname.trim());
    if (success) {
      setEditingNickname(false);
      setNewNickname('');
    }
  };

  const handleBioUpdate = async () => {
    if (!newBio.trim()) {
      toast.error('Please enter a bio');
      return;
    }
    
    // For now, we'll simulate payment - in real app this would integrate with Solana payment
    const success = await setBio(newBio.trim(), 'simulated_transaction_signature');
    if (success) {
      setEditingBio(false);
      setNewBio('');
      toast.success('Bio updated! First change is free, next changes will cost 2 USD.');
    }
  };

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
        {/* Banner */}
        <div className="relative w-full h-32 rounded-lg overflow-hidden group cursor-pointer" onClick={() => setBannerDialogOpen(true)}>
          <ImageLazyLoad
            src={profile?.profile_image_url || '/placeholder.svg'}
            alt="Banner"
            className="w-full h-full object-cover"
            fallbackSrc="/placeholder.svg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex items-start justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="relative -mt-10">
              <Avatar className="w-20 h-20 rounded-full border-4 border-background bg-card">
                <AvatarImage src={profile?.profile_image_url || '/placeholder.svg'} alt="Avatar" />
                <AvatarFallback className="text-xl font-bold">
                  {profile?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setPfpDialogOpen(true)}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-background/80 border hover:bg-muted transition"
                aria-label="Change profile picture"
                title="Change profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                {editingNickname ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={newNickname} 
                      onChange={(e) => setNewNickname(e.target.value)}
                      placeholder="Enter nickname"
                      className="w-48"
                    />
                    <Button size="sm" onClick={handleNicknameUpdate} disabled={nicknameLoading}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingNickname(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{profile?.nickname || 'Set Nickname'}</h2>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setNewNickname(profile?.nickname || '');
                        setEditingNickname(true);
                      }}
                      className="p-1 h-auto"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
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
                {editingBio ? (
                  <div className="space-y-2">
                    <Textarea 
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      placeholder="Tell us about yourself (100 characters max)"
                      maxLength={100}
                      className="resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleBioUpdate} disabled={bioLoading}>
                        Save Bio
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingBio(false)}>
                        Cancel
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      First bio change is free. Next changes cost 2 USD.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground text-sm italic">
                      {profile?.bio || 'Add your bio (100 characters max)'}
                    </p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setNewBio(profile?.bio || '');
                        setEditingBio(true);
                      }}
                      className="p-1 h-auto"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-primary mr-1" />
                <span className="text-2xl font-bold text-primary">{nfts?.length || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">NFTs</p>
            </CardContent>
          </Card>

          <Card className="bg-secondary/5 border-secondary/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-secondary mr-1" />
                <span className="text-2xl font-bold text-foreground">{collections?.length || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Collections</p>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-5 h-5 text-accent mr-1" />
                <span className="text-2xl font-bold text-accent">{profile?.trade_count || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Trades</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/5 border-muted/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 text-destructive mr-1" />
              <span className="text-2xl font-bold text-foreground">{profileLikes}</span>
              </div>
              <p className="text-sm text-muted-foreground">Likes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        {profile && (<span>{profileLikes} likes • {nftLikes} NFT likes</span>)}
      </div>

      {/* PFP Selection Dialog */}
      <Dialog open={pfpDialogOpen} onOpenChange={setPfpDialogOpen}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>Select an NFT for your profile picture</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {nfts && nfts.length > 0 ? (
              nfts.map((nft) => (
                <button key={nft.mint_address} onClick={async () => {
                  const ok = await setPFP(nft.mint_address, 'simulated_transaction_signature');
                  if (ok) {
                    setPfpDialogOpen(false);
                    toast.success('Profile picture updated! First change is free, next changes will cost 2 USD.');
                  }
                }} className="relative rounded-lg overflow-hidden border hover:shadow">
                  <img src={nft.image_url} alt={nft.name} className="w-full h-full object-cover aspect-square" loading="lazy" />
                </button>
              ))
            ) : (
              <p className="text-muted-foreground text-sm col-span-full">No NFTs found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner Monetization Dialog */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Customize your profile banner to stand out in the community!
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-primary" />
                <span className="font-semibold">Banner Pricing</span>
              </div>
              <ul className="text-sm space-y-1">
                <li>• First banner change: <strong>FREE</strong></li>
                <li>• Additional changes: <strong>2 USD each</strong></li>
              </ul>
            </div>
            <Button className="w-full" disabled>
              Upload New Banner (Coming Soon)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collections Grid */}
      <h2 className="text-xl font-semibold mb-4">My Collections</h2>
      {loading ? (
        <p>Loading collections...</p>
      ) : (
        renderCollectionsGrid()
      )}
    </div>
  );
}
