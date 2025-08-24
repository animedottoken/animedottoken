import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle, Eye } from 'lucide-react';
import { useNFTLikes } from '@/hooks/useNFTLikes';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
}

export const NFTCard = ({ nft, navigationQuery }: NFTCardProps) => {
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
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                {ownerNickname || 
                 `${nft.owner_address.slice(0, 4)}...${nft.owner_address.slice(-4)}`}
              </span>
              {ownerVerified && (
                <CheckCircle className="h-3 w-3 text-primary" />
              )}
            </Link>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLike}
            disabled={likeLoading}
            className={`shrink-0 ${isLiked(nft.id) ? "text-red-500" : "text-muted-foreground"}`}
          >
            <Heart className={`h-4 w-4 ${isLiked(nft.id) ? "fill-current" : ""}`} />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          {nft.is_listed && nft.price ? (
            <div className="text-lg font-bold text-primary">
              {nft.price} SOL
            </div>
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