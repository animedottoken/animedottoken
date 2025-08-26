import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Collection } from '@/types/collection';

interface CollectionInfoBannerProps {
  collection: Collection;
  className?: string;
}

export const CollectionInfoBanner: React.FC<CollectionInfoBannerProps> = ({
  collection,
  className = ""
}) => {
  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Collection Avatar */}
          {collection.image_url && (
            <img 
              src={collection.image_url} 
              alt={collection.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border-2 border-primary/20"
            />
          )}
          
          {/* Collection Details */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{collection.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{collection.symbol}</p>
              {collection.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{collection.description}</p>
              )}
            </div>
            
            {/* Collection Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {collection.mint_price > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Mint Price</p>
                  <p className="font-semibold text-primary">{collection.mint_price} SOL</p>
                </div>
              )}
              
              <div className="space-y-1">
                <p className="text-muted-foreground">Supply</p>
                <p className="font-semibold">
                  {collection.items_available}/{collection.max_supply || '∞'}
                </p>
              </div>
              
              {collection.royalty_percentage > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Royalties</p>
                  <p className="font-semibold">{collection.royalty_percentage}%</p>
                </div>
              )}
              
              {collection.category && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Category</p>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {collection.category}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Additional Info */}
            <div className="flex flex-wrap gap-2">
              {collection.whitelist_enabled && (
                <Badge variant="outline" className="text-xs">
                  🔐 Whitelisted
                </Badge>
              )}
              {collection.verified && (
                <Badge variant="default" className="text-xs">
                  ✅ Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

CollectionInfoBanner.displayName = "CollectionInfoBanner";