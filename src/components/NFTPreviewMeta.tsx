import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { truncateAddress } from '@/utils/addressUtils';
import { PriceTag } from '@/components/ui/price-tag';

interface NFTPreviewMetaProps {
  nftId: string;
  nftName?: string;
  nftImage?: string;
  className?: string;
}

interface NFTDetails {
  id: string;
  name: string;
  image_url: string;
  price?: number;
  is_listed: boolean;
  owner_address: string;
  creator_address: string;
  collection_id?: string;
  collections?: {
    name: string;
    max_supply?: number;
  };
}

interface OwnerProfile {
  display_name?: string;
  verified: boolean;
}

export const NFTPreviewMeta = ({ nftId, nftName, nftImage, className = "" }: NFTPreviewMetaProps) => {
  const [nftDetails, setNftDetails] = useState<NFTDetails | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNFTDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch NFT details
        const { data: nftData, error: nftError } = await supabase
          .from('nfts')
          .select(`
            id,
            name,
            image_url,
            price,
            is_listed,
            owner_address,
            creator_address,
            collection_id,
            collections (
              name,
              max_supply
            )
          `)
          .eq('id', nftId)
          .single();

        if (nftError) {
          console.error('Error fetching NFT details:', nftError);
          return;
        }

        setNftDetails(nftData);

        // Fetch owner profile
        if (nftData?.owner_address) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('display_name, verified')
            .eq('wallet_address', nftData.owner_address)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching owner profile:', profileError);
            setOwnerProfile({ verified: false });
          } else {
            setOwnerProfile({
              display_name: profileData?.display_name,
              verified: !!profileData?.verified
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchNFTDetails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTDetails();
  }, [nftId]);

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="h-4 bg-muted animate-pulse rounded"></div>
        <div className="h-3 bg-muted animate-pulse rounded w-2/3"></div>
        <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
      </div>
    );
  }

  if (!nftDetails) {
    return (
      <div className={`text-center text-muted-foreground ${className}`}>
        <p className="text-sm">NFT details unavailable</p>
      </div>
    );
  }

  const displayName = nftName || nftDetails.name;
  const displayImage = nftImage || nftDetails.image_url;
  const ownerDisplayName = ownerProfile?.display_name || truncateAddress(nftDetails.owner_address);
  
  const supplyText = nftDetails.collections?.max_supply 
    ? `Supply: ${nftDetails.collections.max_supply}`
    : 'Standalone';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* NFT Image */}
      <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden">
        <img
          src={displayImage || "/placeholder.svg"}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src !== "/placeholder.svg") {
              img.src = "/placeholder.svg";
            }
          }}
        />
      </div>

      {/* NFT Name */}
      <div>
        <h3 className="font-semibold text-lg truncate" title={displayName}>
          {displayName}
        </h3>
      </div>

      {/* Owner Info */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Owned by</span>
        <Link 
          to={`/creator/${nftDetails.owner_address}`}
          className="inline-flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{ownerDisplayName}</span>
          {ownerProfile?.verified && (
            <CheckCircle className="h-3 w-3 text-primary" />
          )}
        </Link>
      </div>

      {/* Collection & Supply Info */}
      {nftDetails.collections && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Collection:</span>
          <Link
            to={`/collection/${nftDetails.collection_id}`}
            className="text-sm font-medium hover:text-primary transition-colors truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {nftDetails.collections.name}
          </Link>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Supply:</span>
        <Badge variant="secondary" className="text-xs">
          {supplyText}
        </Badge>
      </div>

      {/* Price Info */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Price:</span>
        {nftDetails.is_listed && nftDetails.price !== null && nftDetails.price !== undefined ? (
          <PriceTag amount={nftDetails.price} currency="SOL" size="sm" />
        ) : (
          <div className="text-sm font-medium text-muted-foreground">
            TBD
          </div>
        )}
      </div>
    </div>
  );
};