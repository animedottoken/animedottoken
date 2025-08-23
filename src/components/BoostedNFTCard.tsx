import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Rocket, TrendingUp, Eye, Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
}

export const BoostedNFTCard = ({ listing }: BoostedNFTCardProps) => {
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const [nftPrice, setNftPrice] = useState<number | null>(null);
  const [listed, setListed] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('nfts')
      .select('price,is_listed')
      .eq('id', listing.nft_id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading NFT price:', error);
          setNftPrice(null);
          setListed(false);
          return;
        }
        setNftPrice(data?.price ?? null);
        setListed(!!data?.is_listed);
      });
    return () => { cancelled = true; };
  }, [listing.nft_id]);

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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite(listing.nft_id)) {
      removeFromFavorites(listing.nft_id);
    } else {
      addToFavorites({
        id: listing.nft_id,
        name: listing.nft_name,
        image_url: listing.nft_image_url,
        type: 'nft'
      });
    }
  };

  const handleViewDetails = () => {
    navigate(`/nft/${listing.nft_id}?from=marketplace`);
  };

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-xl transition-all duration-300 ${getTierBorder()} ${
        listing.tier === 'god' ? 'transform hover:scale-105' : 'hover:shadow-lg'
      }`}
      onClick={handleViewDetails}
    >
      <CardContent className="p-0 relative">
        {/* Boost Badge - Top Left */}
        <div className="absolute top-3 left-3 z-20">
          {getTierBadge()}
        </div>

        {/* Price Overlay - Top Right */}
        {listed && nftPrice !== null ? (
          <div className="absolute top-3 right-3 z-20 bg-primary text-primary-foreground font-bold text-sm px-3 py-1 rounded-full shadow-lg">
            {nftPrice} SOL
          </div>
        ) : (
          <div className="absolute top-3 right-3 z-20 bg-muted text-muted-foreground font-medium text-xs px-2 py-1 rounded-full">
            Not Listed
          </div>
        )}

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
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/70 p-3 rounded-full">
                {getTierIcon()}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold line-clamp-1">{listing.nft_name}</h3>
              <p className="text-sm text-muted-foreground">
                Owner: {listing.owner_address.slice(0, 4)}...{listing.owner_address.slice(-4)}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={isFavorite(listing.nft_id) ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 ${isFavorite(listing.nft_id) ? "fill-current" : ""}`} />
            </Button>
          </div>

          <Button className="w-full" variant="outline" onClick={(e) => {e.stopPropagation(); handleViewDetails()}}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
