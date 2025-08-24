import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Zap, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageLazyLoad } from "@/components/ImageLazyLoad";
import { formatDistanceToNow, isPast } from "date-fns";

interface BoostedItemCardProps {
  listing: {
    id: string;
    nft_id: string;
    token_mint: string;
    bid_amount: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    bidder_wallet: string;
    created_at: string;
    nft?: {
      id: string;
      name: string;
      image_url: string;
      mint_address: string;
    };
  };
}

export const BoostedItemCard = ({ listing }: BoostedItemCardProps) => {
  const endTime = new Date(listing.end_time);
  const isExpired = isPast(endTime);
  const timeRemaining = isExpired ? 'Expired' : formatDistanceToNow(endTime, { addSuffix: true });

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (listing.is_active) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden rounded-t-lg bg-muted relative">
          {listing.nft?.image_url ? (
            <ImageLazyLoad
              src={listing.nft.image_url}
              alt={listing.nft.name || 'NFT'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Zap className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Boost indicator overlay */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-yellow-500/90 text-black">
              <Zap className="w-3 h-3 mr-1" />
              Boosted
            </Badge>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold line-clamp-1">
              {listing.nft?.name || 'Unknown NFT'}
            </h3>
            {getStatusBadge()}
          </div>
          
          {/* Boost details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Boost Cost:</span>
              <span className="font-semibold text-primary">
                {listing.bid_amount} ANIME
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Time Remaining:
              </span>
              <span className={`font-medium ${isExpired ? 'text-destructive' : 'text-green-600'}`}>
                {timeRemaining}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Started:</span>
              <span>{formatDistanceToNow(new Date(listing.start_time), { addSuffix: true })}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link to={`/nft/${listing.nft_id}`}>
                <ExternalLink className="w-3 h-3 mr-1" />
                View NFT
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};