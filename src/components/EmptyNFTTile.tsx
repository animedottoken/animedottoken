import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface EmptyNFTTileProps {
  collectionId: string;
  mintedCount: number;
  maxSupply?: number;
}

export const EmptyNFTTile: React.FC<EmptyNFTTileProps> = ({
  collectionId,
  mintedCount,
  maxSupply
}) => {
  return (
    <Link to={`/mint/nft?collection=${collectionId}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50">
        <div className="aspect-square bg-muted/20 rounded-t-lg flex flex-col items-center justify-center p-6">
          <div className="text-6xl mb-4 opacity-50">🖼️</div>
          <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors mt-2">
            Mint NFT
          </p>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm text-muted-foreground group-hover:text-primary transition-colors">
            Create New NFT
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {mintedCount}/{maxSupply || '∞'} minted
          </p>
        </div>
      </Card>
    </Link>
  );
};

EmptyNFTTile.displayName = "EmptyNFTTile";