import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, CheckCircle, Eye, Play, Volume2, Maximize2, Image } from 'lucide-react';
import { detectMediaKind, getMediaTypeDisplay } from '@/lib/media';
import { useNFTLikes } from '@/hooks/useNFTLikes';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { truncateAddress } from '@/utils/addressUtils';
import { PriceTag } from '@/components/ui/price-tag';
import { useAuth } from '@/contexts/AuthContext';
import SocialActionWrapper from '@/components/SocialActionWrapper';
import { toast } from 'sonner';

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
    collections?: {
      name: string;
      symbol?: string;
    };
  };
  navigationQuery?: string;
  overlayActions?: OverlayAction[];
  showOwnerInfo?: boolean;
  verified?: boolean;
  metaLeft?: string;
  onNavigate?: () => void;
  likeCount?: number; // Add like count prop
}

export const NFTCard = ({ nft, navigationQuery, overlayActions, showOwnerInfo = true, verified, metaLeft, onNavigate, likeCount = 0 }: NFTCardProps) => {
  const { isLiked, toggleLike, isPending } = useNFTLikes();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ownerNickname, setOwnerNickname] = useState<string>('');
  const [ownerVerified, setOwnerVerified] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    supabase.functions
      .invoke('get-profile', {
        body: { wallet_address: nft.owner_address }
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading owner profile:', error);
          setOwnerNickname('');
          setOwnerVerified(false);
          return;
        }
        setOwnerNickname(data?.nickname || data?.display_name || '');
        setOwnerVerified(!!data?.verified);
      });
    return () => { cancelled = true; };
  }, [nft.owner_address]);

  const handleViewDetails = () => {
    navigate(`/nft/${nft.id}?${navigationQuery || 'from=marketplace'}`);
  };

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isPending(nft.id)) return;
    
    console.log('Toggling like for NFT:', nft.id, 'Creator:', nft.creator_address);
    await toggleLike(nft.id, nft.creator_address);
  };

  return (
    <Link 
      to={`/nft/${nft.id}?${navigationQuery || 'from=marketplace'}`}
      className="block"
      onClick={onNavigate}
    >
      <Card 
        className="group hover:shadow-lg transition-all cursor-pointer relative"
      >
      <div className="aspect-square overflow-hidden rounded-t-lg bg-muted relative">
        {(() => {
          const imageUrl = nft.image_url || nft.attributes?.image_url || nft.attributes?.image;
          const animationUrl = nft.attributes?.animation_url || nft.attributes?.metadata?.animation_url;
          const mediaType = nft.attributes?.media_type || nft.attributes?.metadata?.media_type;
          
          const detectedKind = detectMediaKind(imageUrl, animationUrl, mediaType);
          
          if (detectedKind === 'video' && animationUrl) {
            return (
              <video
                src={animationUrl}
                poster={imageUrl || "/placeholder.svg"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                onError={(e) => {
                  console.error('Video error, falling back to image');
                  e.currentTarget.style.display = 'none';
                  const img = document.createElement('img');
                  img.src = imageUrl || '/images/og-anime.jpg';
                  img.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform';
                  e.currentTarget.parentNode?.appendChild(img);
                }}
              />
            );
          } else if (detectedKind === 'animated' && animationUrl) {
            return (
              <img
                src={animationUrl}
                alt={nft.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  console.error('Animated image error, falling back to static');
                  e.currentTarget.src = imageUrl || '/images/og-anime.jpg';
                }}
              />
            );
          } else {
            return (
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={nft.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.src = '/images/og-anime.jpg';
                }}
              />
            );
          }
        })()}
        
        {/* Media type indicator - using file detection */}
        {(() => {
          const imageUrl = nft.image_url || nft.attributes?.image_url || nft.attributes?.image;
          const animationUrl = nft.attributes?.animation_url || nft.attributes?.metadata?.animation_url;
          const mediaType = nft.attributes?.media_type || nft.attributes?.metadata?.media_type;
          
          const detectedKind = detectMediaKind(imageUrl, animationUrl, mediaType);
          const displayInfo = getMediaTypeDisplay(detectedKind);
          
          if (!displayInfo) return null;
          
          let IconComponent;
          switch (displayInfo.icon) {
            case 'Play':
              IconComponent = Play;
              break;
            case 'Volume2':
              IconComponent = Volume2;
              break;
            case 'Maximize2':
              IconComponent = Maximize2;
              break;
            case 'Image':
            default:
              IconComponent = Image;
              break;
          }
          
          return (
            <div className="absolute top-2 left-2">
              <Badge className={`${displayInfo.color} text-white text-xs`}>
                <IconComponent className="w-3 h-3 mr-1" />
                {displayInfo.label}
              </Badge>
            </div>
          );
        })()}
        
        {/* Heart button with auth wrapper */}
        <SocialActionWrapper 
          action="like this NFT"
          onAction={(e?: React.MouseEvent) => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            handleLike(e);
          }}
        >
           <Button 
             variant="ghost" 
             size="sm" 
             aria-disabled={isPending(nft.id)}
             onClickCapture={(e) => { console.info('[NFTCard] heart click capture', { id: nft.id, pending: isPending(nft.id) }); if (e.defaultPrevented) return; handleLike(e); }}
             className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 z-20 hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center gap-1 min-w-[50px] pointer-events-auto ${
               isLiked(nft.id)
                 ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400'
                 : 'bg-black/50 text-white hover:bg-black/70 focus-visible:ring-primary'
             } ${isPending(nft.id) ? 'opacity-50' : ''}`}
             title={isLiked(nft.id) ? "Unlike NFT" : "Like NFT"}
             aria-label={isLiked(nft.id) ? "Unlike this NFT" : "Like this NFT"}
           >
             <Heart className={`h-4 w-4 ${isLiked(nft.id) ? "fill-current" : ""}`} />
             {likeCount > 0 && (
               <span className="text-xs font-medium ml-1">{likeCount}</span>
             )}
           </Button>
        </SocialActionWrapper>
        
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
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1 min-h-[1.5rem]">
            <h3 className="font-semibold truncate">{nft.name || 'No Name'}</h3>
            {verified && (
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </div>
          
          {showOwnerInfo ? (
            /* Owner info */
            <Link 
              to={`/creator/${nft.owner_address}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
            >
              <span>
                {ownerNickname || truncateAddress(nft.owner_address)}
              </span>
              {ownerVerified && (
                <CheckCircle className="h-3 w-3 text-primary" />
              )}
            </Link>
          ) : (
            /* Meta info placeholder when no owner info */
            <div className="text-sm text-muted-foreground mb-2">
              {/* Placeholder for spacing when no meta info */}
            </div>
          )}
        </div>
        
         {/* Bottom row with meta left and price right */}
         <div className="flex justify-between items-center">
           {metaLeft && (
             <div className="text-sm text-muted-foreground">
               {metaLeft}
             </div>
           )}
           <div className={metaLeft ? '' : 'ml-auto'}>
             {nft.is_listed && nft.price ? (
               <PriceTag amount={nft.price} currency="SOL" size="sm" />
             ) : (
               <PriceTag tbd currency="SOL" size="sm" />
             )}
           </div>
         </div>
      </CardContent>
    </Card>
    </Link>
  );
};