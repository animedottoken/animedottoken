import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, UserMinus, UserPlus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorFollows } from "@/hooks/useCreatorFollows";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { useNavigate } from "react-router-dom";

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

export default function CreatorProfile() {
  const { wallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const { publicKey } = useSolanaWallet();
  const { isFollowing, toggleFollow, loading: followLoading } = useCreatorFollows();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreator = async () => {
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

        // Count creator's NFTs
        const { count: nftCount } = await supabase
          .from('nfts')
          .select('*', { count: 'exact', head: true })
          .eq('creator_address', wallet);

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
            created_nfts: nftCount || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching creator:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [wallet]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
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
          onClick={() => navigate(-1)}
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
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="max-w-md mx-auto">
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
          
          {publicKey && creator.wallet_address !== publicKey && (
            <Button
              variant={isFollowing(creator.wallet_address) ? "default" : "outline"}
              size="sm"
              disabled={followLoading}
              onClick={() => toggleFollow(creator.wallet_address)}
              className="w-full"
            >
              {isFollowing(creator.wallet_address) ? (
                <>
                  <UserMinus className="w-4 h-4 mr-1" />
                  Liked
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1" />
                  Like
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}