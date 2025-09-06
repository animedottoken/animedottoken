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
import SocialActionWrapper from '@/components/SocialActionWrapper';
interface BoostedListing {
  id: string;
  nft_id: string;
  bid_amount: number;
  bid_rank: number;
  tier: 'god' | 'top' | 'boosted';
  nft_name: string;
  nft_image_url: string;
  owner_address_masked: string;
  end_time: string;
}

interface BoostedNFTCardProps {
  listing: BoostedListing;
  navigationQuery?: string;
}

export const BoostedNFTCard = ({ listing, navigationQuery }: BoostedNFTCardProps) => {
  const { isLiked, toggleLike, loading: likeLoading } = useNFTLikes();
  const navigate = useNavigate();
  const [nftPrice, setNftPrice] = useState<number | null>(null);
  const [listed, setListed] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [ownerNickname, setOwnerNickname] = useState<string>('');
  const [ownerVerified, setOwnerVerified] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('get_nfts_public')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading NFT details:', error);
          setNftPrice(null);
          setListed(false);
          setDescription('');
          return;
        }
        const nft = (data || []).find((n: any) => n.id === listing.nft_id);
        setNftPrice(nft?.price ?? null);
        setListed(!!nft?.is_listed);
        setDescription(nft?.description || '');
      });
    return () => { cancelled = true; };
  }, [listing.nft_id]);

  useEffect(() => {
    let cancelled = false;
    const mask = (addr: string) => `${addr.slice(0,4)}...${addr.slice(-4)}`;
    supabase
      .rpc('get_profiles_public')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading owner profile:', error);
          setOwnerNickname('');
          setOwnerVerified(false);
          return;
        }
        const profile = (data || []).find((p: any) => mask(p.wallet_address) === listing.owner_address_masked);
        setOwnerNickname(profile?.display_name || '');
        setOwnerVerified(!!profile?.verified);
      });
    return () => { cancelled = true; };
  }, [listing.owner_address_masked]);

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
    e.preventDefault();
    e.stopPropagation();
    if (likeLoading) return;
    
    // We need the unmasked creator address for optimistic updates
    // For now, we'll pass null as a fallback - ideally we'd fetch the real address
    toggleLike(listing.nft_id, null);
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
          <SocialActionWrapper 
            action="like this NFT"
            onAction={handleLike}
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={likeLoading}
              className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 z-20 ${
                isLiked(listing.nft_id)
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
              title={isLiked(listing.nft_id) ? "Unlike" : "Like"}
            >
              <Heart className={`h-4 w-4 ${isLiked(listing.nft_id) ? 'fill-current' : ''}`} />
            </Button>
          </SocialActionWrapper>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col h-full">
          <div className="flex-1">
            <h3 className="font-semibold line-clamp-1 mb-1 min-h-[1.5rem]">{listing.nft_name || 'No Name'}</h3>
            
            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                {description}
              </p>
            )}
            
            {/* Owner info */}
            <Link 
              to={`/creator/${listing.owner_address_masked}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span>
                {ownerNickname || listing.owner_address_masked}
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
              <PriceTag tbd currency="SOL" size="sm" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};
