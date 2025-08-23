
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Rocket, TrendingUp, Eye, Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';

interface BoostedNFTCardProps {
  listing: {
    id: string;
    nft_id: string;
    bid_amount: number;
    bid_rank: number;
    tier: 'god' | 'top' | 'boosted';
    nft_name: string;
    nft_image_url: string;
    owner_address: string;
    end_time: string;
  };
}

export const BoostedNFTCard = ({ listing }: BoostedNFTCardProps) => {
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const navigate = useNavigate();

  const getTierIcon = () => {
    switch (listing.tier) {
      case 'god': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'top': return <Rocket className="h-4 w-4 text-gray-400" />;
      default: return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTierBorder = () => {
    switch (listing.tier) {
      case 'god': return 'border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20';
      case 'top': return 'border-2 border-gray-400/50 shadow-lg shadow-gray-400/20';
      default: return 'border-2 border-blue-500/50 shadow-lg shadow-blue-500/20';
    }
  };

  const getTierBadge = () => {
    switch (listing.tier) {
      case 'god': return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <Crown className="h-3 w-3 mr-1" />
          God Tier #{listing.bid_rank}
        </Badge>
      );
      case 'top': return (
        <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
          <Rocket className="h-3 w-3 mr-1" />
          Top Tier #{listing.bid_rank}
        </Badge>
      );
      default: return (
        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
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

  const timeLeft = () => {
    const endTime = new Date(listing.end_time);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m left`;
  };

  const handleViewDetails = () => {
    navigate(`/nft/${listing.nft_id}`);
  };

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-xl transition-all duration-300 ${getTierBorder()} ${
        listing.tier === 'god' ? 'transform hover:scale-105' : 'hover:shadow-lg'
      }`}
      onClick={handleViewDetails}
    >
      <CardContent className="p-0">
        {/* Boost Badge */}
        <div className="absolute top-2 left-2 z-10">
          {getTierBadge()}
        </div>

        {/* Boost Info */}
        <div className="absolute top-2 right-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {listing.bid_amount} $ANIME
        </div>

        {/* Image */}
        <div className={`aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center text-6xl group-hover:scale-105 transition-transform relative ${
          listing.tier === 'god' ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20' : ''
        }`}>
          <img 
            src={listing.nft_image_url} 
            alt={listing.nft_name}
            className="w-full h-full object-cover rounded-t-lg"
            onError={(e) => {
              e.currentTarget.src = '/images/og-anime.jpg';
            }}
          />
          
          {/* Boost tier icon overlay */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/70 p-3 rounded-full">
              {getTierIcon()}
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

          {/* Boost timer */}
          <div className="text-xs text-center py-1 px-2 bg-muted rounded mb-3">
            ⏰ {timeLeft()}
          </div>

          <Button className="w-full" variant="outline" onClick={(e) => {e.stopPropagation(); handleViewDetails()}}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </div>
  );
};
