import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Rocket, TrendingUp, Eye, Heart, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setNavContext } from '@/lib/navContext';
import { supabase } from '@/integrations/supabase/client';
import { truncateAddress } from '@/utils/addressUtils';
import { PriceTag } from '@/components/ui/price-tag';
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
    
    const fetchOwnerProfile = async () => {
      try {
        // First get the NFT to find the owner's user_id
        const { data: nftData, error: nftError } = await supabase
          .from('nfts')
          .select('creator_user_id, owner_address')
          .eq('id', listing.nft_id)
          .single();
        
        if (cancelled) return;
        
        if (nftError || !nftData?.creator_user_id) {
          console.error('Error loading NFT data:', nftError);
          setOwnerNickname('');
          setOwnerVerified(false);
          return;
        }
        
        // Now get the secure profile data using user_id
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_profile_display_by_user_id', { 
            p_user_id: nftData.creator_user_id 
          })
          .single();
        
        if (cancelled) return;
        
        if (profileError) {
          console.error('Error loading owner profile:', profileError);
          setOwnerNickname('');
          setOwnerVerified(false);
          return;
        }
        
        setOwnerNickname(profileData?.display_name || profileData?.nickname || '');
        setOwnerVerified(!!profileData?.verified);
      } catch (err) {
        if (cancelled) return;
        console.error('Error in profile fetch:', err);
        setOwnerNickname('');
        setOwnerVerified(false);
      }
    };
    
    fetchOwnerProfile();
    
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

  const handleViewDetails = () => {
    // Set navigation context for boosted NFTs
    setNavContext({
      type: 'nft',
      items: [listing.nft_id], // Single item for now, could be extended with full boosted list
      source: 'boosted'
    });
    navigate(`/nft/${listing.nft_id}?${navigationQuery || 'from=marketplace'}`);
  };

  const handleCardClick = () => {
    handleViewDetails();
  };

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-xl transition-all duration-300 ${getTierBorder()} ${
        listing.tier === 'god' ? 'transform hover:scale-105' : 'hover:shadow-lg'
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-0 relative">
        {/* Boost Badge - Top Left */}
        <div className="absolute top-3 left-3 z-20">
          {getTierBadge()}
        </div>

        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg overflow-hidden">
          {(() => {
            // For boosted cards, we only have basic image URL, but we can still try to detect animated content
            const imageUrl = listing.nft_image_url;
            const isAnimated = imageUrl && (imageUrl.includes('.gif') || imageUrl.includes('.webp'));
            const isVideo = imageUrl && (imageUrl.includes('.mp4') || imageUrl.includes('.webm'));
            
            if (isVideo) {
              return (
                <video
                  src={imageUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onError={(e) => {
                    console.error('Video error, falling back to image');
                    e.currentTarget.style.display = 'none';
                    const img = document.createElement('img');
                    img.src = '/images/og-anime.jpg';
                    img.className = 'w-full h-full object-cover';
                    e.currentTarget.parentNode?.appendChild(img);
                  }}
                />
              );
            } else {
              return (
                <img 
                  src={imageUrl} 
                  alt={listing.nft_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/og-anime.jpg';
                  }}
                />
              );
            }
          })()}
          
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

          {/* Heart icon - display only */}
          <div className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white z-20">
            <Heart className="h-4 w-4" />
          </div>
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
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${listing.owner_address_masked}`);
              }}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span>
                {ownerNickname || listing.owner_address_masked}
              </span>
              {ownerVerified && (
                <CheckCircle className="h-3 w-3 text-primary" />
              )}
            </button>
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
  );
};
