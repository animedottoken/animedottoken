
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Rocket, TrendingUp, Eye, Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface BoostedNFTCardProps {
  nft: {
    id: string;
    name: string;
    image_url: string;
    price?: number;
    is_listed: boolean;
    owner_address: string;
    collections?: {
      name: string;
    };
    attributes?: {
      rarity?: string;
    };
  };
  boost: {
    bid_rank: number;
    bid_amount: number;
    tier: 'god' | 'top' | 'boosted';
    end_time: string;
  };
  onViewDetails: (nft: any) => void;
}

export const BoostedNFTCard = ({ nft, boost, onViewDetails }: BoostedNFTCardProps) => {
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const getTierIcon = () => {
    switch (boost.tier) {
      case 'god': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'top': return <Rocket className="h-4 w-4 text-gray-400" />;
      default: return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTierBorder = () => {
    switch (boost.tier) {
      case 'god': return 'border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20';
      case 'top': return 'border-2 border-gray-400/50 shadow-lg shadow-gray-400/20';
      default: return 'border-2 border-blue-500/50 shadow-lg shadow-blue-500/20';
    }
  };

  const getTierBadge = () => {
    switch (boost.tier) {
      case 'god': return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <Crown className="h-3 w-3 mr-1" />
          God Tier #{boost.bid_rank}
        </Badge>
      );
      case 'top': return (
        <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
          <Rocket className="h-3 w-3 mr-1" />
          Top Tier #{boost.bid_rank}
        </Badge>
      );
      default: return (
        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <TrendingUp className="h-3 w-3 mr-1" />
          Boosted #{boost.bid_rank}
        </Badge>
      );
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite(nft.id)) {
      removeFromFavorites(nft.id);
    } else {
      addToFavorites({
        id: nft.id,
        name: nft.name,
        image_url: nft.image_url,
        collection_name: nft.collections?.name,
        type: 'nft'
      });
    }
  };

  const timeLeft = () => {
    const endTime = new Date(boost.end_time);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m left`;
  };

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-xl transition-all duration-300 ${getTierBorder()} ${
        boost.tier === 'god' ? 'transform hover:scale-105' : 'hover:shadow-lg'
      }`}
      onClick={() => onViewDetails(nft)}
    >
      <CardContent className="p-0">
        {/* Boost Badge */}
        <div className="absolute top-2 left-2 z-10">
          {getTierBadge()}
        </div>

        {/* Boost Info */}
        <div className="absolute top-2 right-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {boost.bid_amount} $ANIME
        </div>

        {/* Image */}
        <div className={`aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center text-6xl group-hover:scale-105 transition-transform relative ${
          boost.tier === 'god' ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20' : ''
        }`}>
          <img 
            src={nft.image_url} 
            alt={nft.name}
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
              <h3 className="font-semibold line-clamp-1">{nft.name}</h3>
              <p className="text-sm text-muted-foreground">
                {nft.collections?.name || 'Unknown Collection'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={isFavorite(nft.id) ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 ${isFavorite(nft.id) ? "fill-current" : ""}`} />
            </Button>
          </div>

          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-lg font-bold">
                {nft.is_listed && nft.price ? `${Number(nft.price).toFixed(2)} SOL` : 'Not Listed'}
              </div>
              <div className="text-xs text-muted-foreground">
                Owner: {nft.owner_address.slice(0, 4)}...{nft.owner_address.slice(-4)}
              </div>
            </div>
            {nft.attributes?.rarity && (
              <Badge variant="secondary" className="text-xs">
                {nft.attributes.rarity}
              </Badge>
            )}
          </div>

          {/* Boost timer */}
          <div className="text-xs text-center py-1 px-2 bg-muted rounded mb-3">
            ⏰ {timeLeft()}
          </div>

          <Button className="w-full" variant="outline" onClick={(e) => {e.stopPropagation(); onViewDetails(nft)}}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
