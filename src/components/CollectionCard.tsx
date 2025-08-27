import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle, Eye } from 'lucide-react';
import { useCollectionLikes } from '@/hooks/useCollectionLikes';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { truncateAddress } from '@/utils/addressUtils';
import { PriceTag } from '@/components/ui/price-tag';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

interface OverlayAction {
  label: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: boolean;
}

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    image_url: string;
    mint_price?: number;
    creator_address_masked: string;
    max_supply?: number;
    items_redeemed: number;
    verified?: boolean;
    description?: string;
  };
  navigationQuery?: string;
  overlayActions?: OverlayAction[];
  showCreatorInfo?: boolean;
  onNavigate?: () => void;
}

export const CollectionCard = ({ 
  collection, 
  navigationQuery, 
  overlayActions, 
  showCreatorInfo = true,
  onNavigate
}: CollectionCardProps) => {
  const { isLiked, toggleLike, loading: likeLoading } = useCollectionLikes();
  const { connect, connecting, publicKey } = useSolanaWallet();
  const navigate = useNavigate();
  const [creatorNickname, setCreatorNickname] = useState<string>('');
  const [creatorVerified, setCreatorVerified] = useState<boolean>(false);

  useEffect(() => {
    if (!showCreatorInfo) return;
    
    let cancelled = false;
    // Only fetch creator info for non-masked addresses (authenticated users will see full addresses)
    if (!collection.creator_address_masked.includes('...')) {
      supabase
        .from('user_profiles')
        .select('display_name,verified')
        .eq('wallet_address', collection.creator_address_masked)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            console.error('Error loading creator profile:', error);
            setCreatorNickname('');
            setCreatorVerified(false);
            return;
          }
          setCreatorNickname(data?.display_name || '');
          setCreatorVerified(!!data?.verified);
        });
    }
    return () => { cancelled = true; };
  }, [collection.creator_address_masked, showCreatorInfo]);

  const handleViewDetails = () => {
    navigate(`/collection/${collection.id}?${navigationQuery || 'from=marketplace'}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (likeLoading || connecting) return;
    
    if (!publicKey) {
      await connect();
      return;
    }
    
    console.log('Toggling like for collection:', collection.id);
    const success = await toggleLike(collection.id);
    console.log('Like toggle result:', success);
  };

  const displayCreatorInfo = collection.creator_address_masked.includes('...') 
    ? truncateAddress(collection.creator_address_masked)
    : (creatorNickname || truncateAddress(collection.creator_address_masked));

  return (
    <Link 
      to={`/collection/${collection.id}?${navigationQuery || 'from=marketplace'}`}
      className="block"
      onClick={onNavigate}
    >
      <Card 
        className="group hover:shadow-lg transition-all cursor-pointer relative"
      >
        <div className="aspect-square overflow-hidden rounded-t-lg bg-muted relative">
          <img
            src={collection.image_url || "/placeholder.svg"}
            alt={collection.name}
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
            disabled={likeLoading || connecting}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 z-20 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 ${
              publicKey && isLiked(collection.id)
                ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400'
                : 'bg-black/50 text-white hover:bg-black/70 focus-visible:ring-primary'
            }`}
            title={!publicKey ? "Connect to like" : isLiked(collection.id) ? "Unlike Collection" : "Like Collection"}
            aria-label={!publicKey ? "Connect to like this collection" : isLiked(collection.id) ? "Unlike this collection" : "Like this collection"}
          >
            <Heart className={`h-4 w-4 ${publicKey && isLiked(collection.id) ? "fill-current" : ""}`} />
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
                aria-label="View Collection Details"
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
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="font-semibold truncate">{collection.name}</h3>
              {collection.verified && (
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            
            {showCreatorInfo && (
              /* Creator info */
              collection.creator_address_masked.includes('...') ? (
                <div className="text-sm text-muted-foreground mb-2">
                  {displayCreatorInfo}
                </div>
              ) : (
                <Link 
                  to={`/creator/${collection.creator_address_masked}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
                >
                  <span>{displayCreatorInfo}</span>
                  {creatorVerified && (
                    <CheckCircle className="h-3 w-3 text-primary" />
                  )}
                </Link>
              )
            )}
          </div>
          
          {/* Bottom row with minted progress and price */}
          <div className="flex justify-between items-end">
            <div className="text-sm text-muted-foreground">
              {collection.items_redeemed}/{collection.max_supply || '∞'} minted
            </div>
            
            {collection.mint_price && collection.mint_price > 0 && (
              <PriceTag amount={collection.mint_price} currency="SOL" size="sm" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};