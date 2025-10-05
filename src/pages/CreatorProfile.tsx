import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ChevronLeft, ChevronRight, Grid3x3 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageLazyLoad } from "@/components/ImageLazyLoad";
import profileBanner from '@/assets/profile-banner.jpg';
import { getNavContext, clearNavContext, setNavContext } from "@/lib/navContext";
import { NFTCard } from '@/components/NFTCard';
import { CollectionCard } from '@/components/CollectionCard';

interface Creator {
  wallet_address?: string;
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
  symbol?: string;
  image_url: string;
  description?: string;
  items_total: number;
  items_redeemed: number;
  verified?: boolean;
  mint_price?: number;
}

export default function CreatorProfile() {
  const { wallet: maskedWallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorNFTs, setCreatorNFTs] = useState<NFT[]>([]);
  const [creatorCollections, setCreatorCollections] = useState<Collection[]>([]);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'nfts';
  });

  useEffect(() => {
    if (activeTab) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!maskedWallet) {
        console.error('No wallet provided in URL');
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Fetch profile directly from user_profiles
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id, nickname, display_name, bio, profile_image_url, banner_image_url, trade_count, profile_rank, verified, nft_count')
          .eq('wallet_address', maskedWallet)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          toast.error('Unable to load profile');
          setLoading(false);
          return;
        }

        setCreator({
          wallet_address: maskedWallet,
          user_id: profile?.user_id,
          nickname: profile?.nickname || profile?.display_name,
          bio: profile?.bio,
          profile_image_url: profile?.profile_image_url,
          banner_image_url: profile?.banner_image_url,
          trade_count: profile?.trade_count || 0,
          profile_rank: profile?.profile_rank || 'DEFAULT',
          verified: profile?.verified || false,
          follower_count: 0,
          nft_likes_count: 0,
          created_nfts: profile?.nft_count || 0,
        });

        // Fetch public NFTs
        const { data: allPublicNFTs } = await supabase.rpc('get_nfts_public');
        const creatorPublicNFTs = (allPublicNFTs || [])
          .filter((nft: any) => nft.creator_address_masked === maskedWallet)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setCreatorNFTs(creatorPublicNFTs.map((nft: any) => ({
          id: nft.id,
          name: nft.name,
          image_url: nft.image_url,
          price: nft.price,
          collection_address: nft.collection_id,
          collection_name: undefined,
          likes_count: 0
        })));

        // Fetch public collections
        const { data: allPublicCollections } = await supabase.rpc('get_collections_public');
        const creatorPublicCollections = (allPublicCollections || [])
          .filter((collection: any) => collection.creator_address_masked === maskedWallet)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setCreatorCollections(creatorPublicCollections.map((collection: any) => ({
          id: collection.id,
          name: collection.name,
          symbol: collection.symbol,
          image_url: collection.image_url,
          description: collection.description,
          mint_price: collection.mint_price,
          items_total: collection.max_supply || 0,
          items_redeemed: collection.items_redeemed || 0,
          verified: collection.verified || false
        })));

      } catch (err) {
        console.error('Unexpected error loading profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [maskedWallet]);

  const handleBackClick = () => {
    const nftContext = getNavContext('nft');
    const collectionContext = getNavContext('collection');
    const context = nftContext || collectionContext;
    
    if (context?.source && context.items) {
      if (context.type === 'nft') {
        navigate(`/nft/${context.items[0]}?from=${context.source}`);
      } else {
        navigate(`/collection/${context.items[0]}?from=${context.source}`);
      }
    } else {
      const from = searchParams.get('from');
      if (from === 'marketplace') {
        navigate('/marketplace');
      } else if (from === 'mint') {
        navigate('/mint');
      } else {
        navigate(-1);
      }
    }
    clearNavContext();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button variant="ghost" onClick={handleBackClick} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={handleBackClick} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-primary/20 to-accent/20">
          <AspectRatio ratio={16 / 4}>
            <ImageLazyLoad
              src={creator.banner_image_url || profileBanner}
              alt="Profile banner"
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </div>
        
        <CardContent className="pt-0 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={creator.profile_image_url} />
              <AvatarFallback>{creator.nickname?.[0] || 'A'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold truncate">
                  {creator.nickname || maskedWallet}
                </h1>
                {creator.verified && (
                  <Badge variant="default" className="shrink-0">Verified</Badge>
                )}
              </div>
              
              {creator.bio && (
                <p className="text-muted-foreground mb-4 line-clamp-2">{creator.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="font-semibold">{creator.created_nfts}</span>
                  <span className="text-muted-foreground ml-1">NFTs</span>
                </div>
                <div>
                  <span className="font-semibold">{creatorCollections.length}</span>
                  <span className="text-muted-foreground ml-1">Collections</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="nfts">
          {creatorNFTs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creatorNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={{
                    ...nft,
                    owner_address: maskedWallet,
                    creator_address: maskedWallet,
                    creator_nickname: creator.nickname,
                    creator_verified: creator.verified,
                    mint_address: '',
                    is_listed: false,
                  }}
                  navigationQuery={`from=profile&wallet=${maskedWallet}`}
                  showOwnerInfo={false}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Grid3x3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No NFTs yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collections">
          {creatorCollections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creatorCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={{
                    ...collection,
                    creator_address: maskedWallet,
                    creator_nickname: creator.nickname,
                    creator_verified: creator.verified,
                    items_redeemed: collection.items_redeemed,
                  }}
                  navigationQuery={`from=profile&wallet=${maskedWallet}`}
                  showCreatorInfo={false}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Grid3x3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No collections yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
