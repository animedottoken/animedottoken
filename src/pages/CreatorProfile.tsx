import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, UserMinus, UserPlus, ArrowLeft, Heart, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorFollows } from "@/hooks/useCreatorFollows";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { useNFTLikes } from "@/hooks/useNFTLikes";

interface Creator {
  wallet_address: string;
  nickname?: string;
  bio?: string;
  profile_image_url?: string;
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

export default function CreatorProfile() {
  const { wallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const { publicKey } = useSolanaWallet();
  const { isFollowing, toggleFollow, loading: followLoading } = useCreatorFollows();
  const { isLiked, toggleLike, loading: nftLikeLoading } = useNFTLikes();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorNFTs, setCreatorNFTs] = useState<NFT[]>([]);
  const [creatorCollections, setCreatorCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Optimistic follow toggle to update counts immediately
  const handleToggleFollow = async (creatorWallet: string) => {
    const wasFollowing = isFollowing(creatorWallet);
    const ok = await toggleFollow(creatorWallet);
    if (ok) {
      setCreator(prev => prev ? { 
        ...prev, 
        follower_count: Math.max(0, (prev.follower_count || 0) + (wasFollowing ? -1 : 1)) 
      } : prev);
    }
  };
  const handleToggleLike = async (nftId: string) => {
    const wasLiked = isLiked(nftId);
    const ok = await toggleLike(nftId);
    if (ok) {
      setCreatorNFTs(prev => prev.map(n => n.id === nftId ? { ...n, likes_count: Math.max(0, n.likes_count + (wasLiked ? -1 : 1)) } : n));
      setCreator(prev => prev ? { ...prev, nft_likes_count: Math.max(0, (prev.nft_likes_count || 0) + (wasLiked ? -1 : 1)) } : prev);
    }
  };

  // Refresh follower count for creator from DB (used for realtime events)
  const refreshFollowerCount = async () => {
    try {
      if (!wallet) return;
      const { data: stats } = await supabase
        .from('creators_public_stats')
        .select('follower_count')
        .eq('wallet_address', wallet)
        .single();

      if (stats) {
        setCreator(prev => prev ? { ...prev, follower_count: stats.follower_count || 0 } : prev);
      }
    } catch (e) {
      console.error('Error refreshing follower count:', e);
    }
  };

  // Refresh like counts for creator NFTs from DB (used for realtime events)
  const refreshLikeCounts = async () => {
    try {
      if (creatorNFTs.length === 0) return;
      const ids = creatorNFTs.map(n => n.id);
      const { data: likeRows } = await supabase
        .from('nft_likes')
        .select('nft_id')
        .in('nft_id', ids);

      const counts: Record<string, number> = {};
      (likeRows || []).forEach((r: any) => {
        counts[r.nft_id] = (counts[r.nft_id] || 0) + 1;
      });

      setCreatorNFTs(prev => prev.map(n => ({ ...n, likes_count: counts[n.id] || 0 })));
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      setCreator(prev => prev ? { ...prev, nft_likes_count: total } : prev);
    } catch (e) {
      console.error('Error refreshing like counts:', e);
    }
  };

  // Subscribe to realtime changes and refresh counts
  useEffect(() => {
    const channel = supabase
      .channel('creator-profile-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nft_likes' }, () => {
        refreshLikeCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creator_follows' }, () => {
        refreshFollowerCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [wallet, creatorNFTs.length]);

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!wallet) return;

      try {
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
        const { data: collections, error: collectionsError } = await supabase
          .from('collections')
          .select('*')
          .eq('creator_address', wallet)
          .order('created_at', { ascending: false });

        console.log('Collections query result:', { collections, collectionsError });

        if (profile) {
          setCreator({
            wallet_address: profile.wallet_address,
            nickname: profile.nickname,
            bio: profile.bio,
            profile_image_url: profile.profile_image_url,
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

          // Load like rows for these NFTs
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

          // Update creator NFT like total
          const totalLikes = Object.values(counts).reduce((a, b) => a + b, 0);
          setCreator(prev => prev ? { ...prev, nft_likes_count: totalLikes } : prev);
        }

        // Process Collections data
        if (collections) {
          console.log('Processing collections:', collections);
          setCreatorCollections(collections.map(collection => ({
            id: collection.id,
            name: collection.name,
            image_url: collection.image_url || collection.banner_image_url,
            description: collection.description,
            items_total: collection.max_supply || 0,
            items_redeemed: collection.items_redeemed || 0,
            verified: collection.verified || false
          })));
        } else {
          console.log('No collections found for creator:', wallet);
        }
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
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/marketplace?tab=creators')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage 
                  src={creator.profile_image_url} 
                  alt={creator.nickname || creator.wallet_address} 
                />
                <AvatarFallback className="text-lg">
                  {creator.nickname ? creator.nickname[0].toUpperCase() : creator.wallet_address.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="font-semibold">
                  {creator.nickname || `${creator.wallet_address.slice(0, 4)}...${creator.wallet_address.slice(-4)}`}
                </h3>
                {creator.verified && (
                  <Badge variant="secondary" className="text-xs">✓</Badge>
                )}
              </div>
              
              {creator.bio && (
                <p className="text-sm text-muted-foreground italic mb-4">
                  {creator.bio}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-4">
                <div className="text-center">
                  <div className="font-semibold text-foreground">{creator.follower_count}</div>
                  <div>Likes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">{creator.nft_likes_count}</div>
                  <div>NFT Likes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">{creator.created_nfts}</div>
                  <div>NFTs</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">{creator.trade_count}</div>
                  <div>Trades</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge 
                  variant="outline" 
                  className={`${
                    creator.profile_rank === 'DIAMOND' ? 'border-purple-500 text-purple-600' :
                    creator.profile_rank === 'GOLD' ? 'border-yellow-500 text-yellow-600' :
                    creator.profile_rank === 'SILVER' ? 'border-gray-400 text-gray-600' :
                    creator.profile_rank === 'BRONZE' ? 'border-orange-500 text-orange-600' :
                    'border-green-500 text-green-600'
                  }`}
                >
                  <span>{creator.profile_rank === 'DEFAULT' ? 'Rookie' : creator.profile_rank}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center ml-1" aria-label="Rank info">
                          <Info className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2 text-sm">
                          <div className="font-semibold">Ranking System:</div>
                          <div>🏆 <strong>Diamond</strong>: 1,000+ trades</div>
                          <div>🥇 <strong>Gold</strong>: 250+ trades</div>
                          <div>🥈 <strong>Silver</strong>: 50+ trades</div>
                          <div>🥉 <strong>Bronze</strong>: 10+ trades</div>
                          <div>🎖️ <strong>Rookie</strong>: 0-9 trades</div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Trade more NFTs to increase your rank!
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Badge>
              </div>
              
              {publicKey && (
                <button
                  aria-label={isFollowing(creator.wallet_address) ? 'Unlike creator' : 'Like creator'}
                  disabled={followLoading}
                  onClick={() => handleToggleFollow(creator.wallet_address)}
                  className="inline-flex items-center justify-center p-2 rounded-md border hover:bg-muted transition-colors"
                >
                  <Heart className={`${isFollowing(creator.wallet_address) ? 'fill-current text-destructive' : 'text-muted-foreground'} w-5 h-5`} />
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Creator Portfolio */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="nfts">NFTs ({creatorNFTs.length})</TabsTrigger>
              <TabsTrigger value="collections">Collections ({creatorCollections.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recent NFTs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Recent NFTs
                      {creatorNFTs.length > 4 && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("nfts")}>
                          View All
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {creatorNFTs.slice(0, 4).map((nft) => (
                        <div key={nft.id} className="aspect-square relative group cursor-pointer">
                          <img 
                            src={nft.image_url} 
                            alt={nft.name}
                            className="w-full h-full object-cover rounded-lg"
                            onClick={() => navigate(`/nft/${nft.id}`)}
                          />
                          {/* Heart like button */}
                            <button
                              aria-label={isLiked(nft.id) ? 'Unlike NFT' : 'Like NFT'}
                              onClick={(e) => { e.stopPropagation(); handleToggleLike(nft.id); }}
                              disabled={nftLikeLoading}
                              className="absolute top-2 right-2 z-10 p-2 rounded-md border bg-background/80 backdrop-blur hover:bg-muted transition-colors"
                            >
                              <Heart className={`${isLiked(nft.id) ? 'fill-current text-destructive' : 'text-muted-foreground'} w-4 h-4`} />
                            </button>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {creatorNFTs.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">No NFTs created yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Collections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Collections
                      {creatorCollections.length > 2 && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("collections")}>
                          View All
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {creatorCollections.slice(0, 2).map((collection) => (
                        <div key={collection.id} className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2">
                          <img 
                            src={collection.image_url} 
                            alt={collection.name}
                            className="w-12 h-12 object-cover rounded-lg"
                            onClick={() => navigate(`/collection/${collection.id}`)}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{collection.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {collection.items_redeemed}/{collection.items_total} items
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {creatorCollections.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">No collections created yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="nfts" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {creatorNFTs.map((nft) => (
                  <Card key={nft.id} className="group hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="aspect-square relative mb-3">
                        <img 
                          src={nft.image_url} 
                          alt={nft.name}
                          className="w-full h-full object-cover rounded-lg"
                          onClick={() => navigate(`/nft/${nft.id}`)}
                        />
                      </div>
                      <h4 className="font-medium truncate mb-2">{nft.name}</h4>
                      {nft.collection_name && (
                        <p className="text-xs text-muted-foreground mb-2">{nft.collection_name}</p>
                      )}
                      <div className="flex items-center justify-between">
                        {nft.price && (
                          <span className="text-sm font-medium">{nft.price} ANIME</span>
                        )}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLike(nft.id);
                            }}
                            disabled={nftLikeLoading}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Heart 
                              className={`w-4 h-4 ${
                                isLiked(nft.id) 
                                  ? 'fill-current text-destructive' 
                                  : 'text-muted-foreground'
                              }`} 
                            />
                          </button>
                          <span className="text-xs text-muted-foreground">{nft.likes_count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {creatorNFTs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No NFTs created yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="collections" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatorCollections.map((collection) => (
                  <Card key={collection.id} className="group hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="aspect-square relative mb-3">
                        <img 
                          src={collection.image_url} 
                          alt={collection.name}
                          className="w-full h-full object-cover rounded-lg"
                          onClick={() => navigate(`/collection/${collection.id}`)}
                        />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">{collection.name}</h4>
                        {collection.verified && (
                          <Badge variant="secondary" className="text-xs">✓</Badge>
                        )}
                      </div>
                      {collection.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{collection.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{collection.items_redeemed}/{collection.items_total} items</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {creatorCollections.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No collections created yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}