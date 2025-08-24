import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useCollections } from '@/hooks/useCollections';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart } from 'lucide-react';
import { ImageLazyLoad } from '@/components/ImageLazyLoad';
import { useToast } from "@/components/ui/use-toast"
import { useCollectionLikes } from '@/hooks/useCollectionLikes';
import { ExportTradingDataButton } from '@/components/ExportTradingDataButton';

export default function Profile() {
  const navigate = useNavigate();
  const { publicKey, connected, connect } = useSolanaWallet();
  const { collections, loading, refreshCollections } = useCollections();
  const { toast } = useToast()
  const [profile, setProfile] = useState<{
    nickname: string | null;
    profile_image_url: string | null;
    banner_image_url: string | null;
  }>({
    nickname: null,
    profile_image_url: null,
    banner_image_url: null,
  });
  const { likedCollections, toggleLike, isLiked } = useCollectionLikes();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!publicKey) return;
      try {
        const response = await fetch(`/api/profile?wallet=${publicKey}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProfile({
          nickname: data.nickname,
          profile_image_url: data.profile_image_url,
          banner_image_url: data.banner_image_url,
        });
      } catch (error) {
        console.error("Could not fetch profile:", error);
        toast({
          variant: "destructive",
          title: "Failed to load profile",
          description: "There was an issue loading your profile data.",
        })
      }
    };

    fetchProfile();
  }, [publicKey, toast]);

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

      {/* Profile Section */}
      <div className="mb-8">
        <div className="relative w-full h-32 rounded-md overflow-hidden">
          <ImageLazyLoad
            src={profile.banner_image_url || '/placeholder.svg'}
            alt="Banner"
            className="w-full h-full object-cover"
            fallbackSrc="/placeholder.svg"
          />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
        </div>
        <div className="flex items-center mt-2">
          <Avatar className="w-16 h-16 rounded-full border-2 border-white -mt-8 mr-4 relative">
            <AvatarImage src={profile.profile_image_url || '/placeholder.svg'} alt="Avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{profile.nickname || 'Unnamed User'}</h2>
            <p className="text-muted-foreground">{publicKey}</p>
          </div>
        </div>
      </div>

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
