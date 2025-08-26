import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Rocket, TrendingUp, Eye, Heart, CheckCircle } from 'lucide-react';
import { useNFTLikes } from '@/hooks/useNFTLikes';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { truncateAddress } from '@/utils/addressUtils';
import { PriceTag } from '@/components/ui/price-tag';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
interface BoostedListing {
  id: string;
  nft_id: string;
  bid_amount: number;
  bid_rank: number;
  tier: 'god' | 'top' | 'boosted';
  nft_name: string;
  nft_image_url: string;
  owner_address: string;
  end_time: string;
}

interface BoostedNFTCardProps {
  listing: BoostedListing;
  navigationQuery?: string;
}

export const BoostedNFTCard = ({ listing, navigationQuery }: BoostedNFTCardProps) => {
  const { isLiked, toggleLike, loading: likeLoading } = useNFTLikes();
  const { connect, connecting, publicKey } = useSolanaWallet();
  const navigate = useNavigate();
  const [nftPrice, setNftPrice] = useState<number | null>(null);
  const [listed, setListed] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [ownerNickname, setOwnerNickname] = useState<string>('');
  const [ownerVerified, setOwnerVerified] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('nfts')
      .select('price,is_listed,description')
      .eq('id', listing.nft_id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading NFT details:', error);
          setNftPrice(null);
          setListed(false);
          setDescription('');
          return;
        }
        setNftPrice(data?.price ?? null);
        setListed(!!data?.is_listed);
        setDescription(data?.description || '');
      });
    return () => { cancelled = true; };
  }, [listing.nft_id]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('user_profiles')
      .select('display_name,verified')
      .eq('wallet_address', listing.owner_address)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading owner profile:', error);
          setOwnerNickname('');
          setOwnerVerified(false);
          return;
        }
        setOwnerNickname(data?.display_name || '');
        setOwnerVerified(!!data?.verified);
      });
    return () => { cancelled = true; };
  }, [listing.owner_address]);

  const getTierIcon = () => {
    switch (listing.tier) {
      case 'god': return <Crown className="h-4 w-4" />;
      case 'top': return <Rocket className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getTierBorder = () => {
    switch (listing.tier) {
      case 'god': return 'border-2 border-primary shadow-lg shadow-primary/20';
      case 'top': return 'border-2 border-accent shadow-lg shadow-accent/20';
      default: return 'border-2 border-secondary shadow-lg shadow-secondary/20';
    }
  };

  const getTierBadge = () => {
    switch (listing.tier) {
      case 'god': return (
        <Badge className="bg-primary text-primary-foreground font-bold">
          <Crown className="h-3 w-3 mr-1" />
          God Tier #{listing.bid_rank}
        </Badge>
      );
      case 'top': return (
        <Badge className="bg-accent text-accent-foreground font-bold">
          <Rocket className="h-3 w-3 mr-1" />
          Top Tier #{listing.bid_rank}
        </Badge>
      );
      default: return (
        <Badge className="bg-secondary text-secondary-foreground font-bold">
          <TrendingUp className="h-3 w-3 mr-1" />
          Boosted #{listing.bid_rank}
        </Badge>
      );
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeLoading || connecting) return;
    
    if (!publicKey) {
      await connect();
      return;
    }
    
    toggleLike(listing.nft_id);
  };

  const handleViewDetails = () => {
    navigate(`/nft/${listing.nft_id}?${navigationQuery || 'from=marketplace'}`);
  };

  return (
    <Link 
      to={`/nft/${listing.nft_id}?${navigationQuery || 'from=marketplace'}`}
      className="block"
    >
      <Card 
        className={`group cursor-pointer hover:shadow-xl transition-all duration-300 ${getTierBorder()} ${
          listing.tier === 'god' ? 'transform hover:scale-105' : 'hover:shadow-lg'
        }`}
      >
      <CardContent className="p-0 relative">
        {/* Boost Badge - Top Left */}
        <div className="absolute top-3 left-3 z-20">
          {getTierBadge()}
        </div>

        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg overflow-hidden">
          <img 
            src={listing.nft_image_url} 
            alt={listing.nft_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/images/og-anime.jpg';
            }}
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-10">
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails();
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
          </div>

          {/* Heart button - top right */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeLoading || connecting}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 z-20 ${
              publicKey && isLiked(listing.nft_id)
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}
            title={!publicKey ? "Connect to like" : isLiked(listing.nft_id) ? "Unlike" : "Like"}
          >
            <Heart className={`h-4 w-4 ${publicKey && isLiked(listing.nft_id) ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col h-full">
          <div className="flex-1">
            <h3 className="font-semibold line-clamp-1 mb-1">{listing.nft_name}</h3>
            
            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                {description}
              </p>
            )}
            
            {/* Owner info */}
            <Link 
              to={`/creator/${listing.owner_address}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span>
                {ownerNickname || truncateAddress(listing.owner_address)}
              </span>
              {ownerVerified && (
                <CheckCircle className="h-3 w-3 text-primary" />
              )}
            </Link>
          </div>
          
          {/* Price positioned bottom right */}
          <div className="flex justify-end mt-2">
            {listed && nftPrice !== null ? (
              <PriceTag amount={nftPrice} currency="SOL" size="sm" />
            ) : (
              <div className="text-sm text-muted-foreground">Not Listed</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};
