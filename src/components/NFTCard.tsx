import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle, Eye } from 'lucide-react';
import { useNFTLikes } from '@/hooks/useNFTLikes';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { truncateAddress } from '@/utils/addressUtils';
import { PriceTag } from '@/components/ui/price-tag';

interface OverlayAction {
  label: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: boolean;
}

interface NFTCardProps {
  nft: {
    id: string;
    name: string;
    image_url: string;
    price?: number;
    owner_address: string;
    creator_address: string;
    mint_address: string;
    is_listed: boolean;
    collection_id?: string;
    description?: string;
    attributes?: any;
  };
  navigationQuery?: string;
  overlayActions?: OverlayAction[];
}

export const NFTCard = ({ nft, navigationQuery, overlayActions }: NFTCardProps) => {
  const { isLiked, toggleLike, loading: likeLoading } = useNFTLikes();
  const navigate = useNavigate();
  const [ownerNickname, setOwnerNickname] = useState<string>('');
  const [ownerVerified, setOwnerVerified] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('user_profiles')
      .select('display_name,verified')
      .eq('wallet_address', nft.owner_address)
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
  }, [nft.owner_address]);

  const handleViewDetails = () => {
    navigate(`/nft/${nft.id}?${navigationQuery || 'from=marketplace'}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!likeLoading) {
      toggleLike(nft.id);
    }
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all cursor-pointer relative"
      onClick={handleViewDetails}
    >
      <div className="aspect-square overflow-hidden rounded-t-lg bg-muted relative">
        <img
          src={nft.image_url || "/placeholder.svg"}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onError={(e) => {
            e.currentTarget.src = '/images/og-anime.jpg';
          }}
        />
        
        {/* Heart button - moved to top right corner */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLike}
          disabled={likeLoading}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 z-20 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isLiked(nft.id)
              ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400'
              : 'bg-black/50 text-white hover:bg-black/70 focus-visible:ring-primary'
          }`}
          title={isLiked(nft.id) ? "Unlike NFT" : "Like NFT"}
          aria-label={isLiked(nft.id) ? "Unlike this NFT" : "Like this NFT"}
        >
          <Heart className={`h-4 w-4 ${isLiked(nft.id) ? "fill-current" : ""}`} />
        </Button>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-10 flex flex-wrap items-center justify-center gap-1 px-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
              className="bg-white/90 text-black hover:bg-white hover:!text-black border-white/20 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
              title="View Details"
              aria-label="View NFT Details"
            >
              <Eye className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">View</span>
            </Button>
            {overlayActions?.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant || "outline"}
                disabled={action.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(e);
                }}
                className={`${
                  action.variant === 'destructive' 
                    ? 'bg-red-500/90 text-white hover:bg-red-500 border-red-500/20 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 transition-all duration-200' 
                    : 'bg-white/90 text-black hover:bg-white hover:!text-black border-white/20 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200'
                }`}
                title={action.label}
                aria-label={action.label}
              >
                {action.icon}
                <span className="ml-1 hidden sm:inline">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 mr-2">
            <h3 className="font-semibold truncate mb-1">{nft.name}</h3>
            
            {/* Owner info */}
            <Link 
              to={`/creator/${nft.owner_address}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span>
                {ownerNickname || truncateAddress(nft.owner_address)}
              </span>
              {ownerVerified && (
                <CheckCircle className="h-3 w-3 text-primary" />
              )}
            </Link>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {nft.is_listed && nft.price ? (
            <PriceTag amount={nft.price} currency="SOL" size="sm" />
          ) : (
            <div className="text-sm text-muted-foreground">
              Not Listed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};