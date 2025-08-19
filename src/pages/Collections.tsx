import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { 
  Plus, 
  Image as ImageIcon, 
  ExternalLink,
  Eye,
  Verified,
  Settings
} from "lucide-react";
import { useCollections } from "@/hooks/useCollections";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { formatDistanceToNow } from "date-fns";

export default function Collections() {
  const { connected } = useSolanaWallet();
  const { collections, loading } = useCollections();

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      art: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      photography: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      music: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      gaming: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      pfp: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      utility: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[category || 'other'] || colors.other;
  };

  if (!connected) {
    return (
      <>
        <Helmet>
          <title>NFT Collections | Anime Token - Create & Manage Collections</title>
          <meta name="description" content="Create and manage your NFT collections on Solana blockchain. Design unique collections with custom properties and royalties." />
        </Helmet>
        
        <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Connect your Solana wallet to create and manage NFT collections.
              </p>
              <SolanaWalletButton />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Collections - NFT Marketplace</title>
        <meta name="description" content="View and manage your NFT collections on Solana blockchain" />
        <meta name="keywords" content="NFT collections, Solana NFTs, digital art collections, NFT creator" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              My Collections
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Organize and showcase your NFTs in themed collections. Collections help users discover and browse your work.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="w-full h-48 bg-muted rounded-lg" />
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-2xl font-semibold mb-4">No Collections Yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Create your first collection to organize and showcase your NFTs. Collections help users discover and browse your work.
                </p>
                <Button asChild size="lg">
                  <a href="/mint">Create First Collection</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Collection Banner */}
                  <div className="relative">
                    <AspectRatio ratio={3/1}>
                      {collection.banner_image_url ? (
                        <img
                          src={collection.banner_image_url}
                          alt={`${collection.name} banner`}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 w-full h-full flex items-center justify-center">
                          <div className="text-4xl opacity-50">🎨</div>
                        </div>
                      )}
                    </AspectRatio>
                    
                    {/* Square NFT Avatar Overlay */}
                    <div className="absolute -bottom-6 left-4">
                      <div className="w-12 h-12 border-4 border-background rounded-lg overflow-hidden">
                        {collection.image_url ? (
                          <img
                            src={collection.image_url}
                            alt={`${collection.name} avatar`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-semibold">
                            {collection.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {collection.verified && (
                        <Badge variant="secondary" className="bg-blue-500 text-white">
                          <Verified className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {collection.is_live && (
                        <Badge variant="secondary" className="bg-green-500 text-white">
                          Live
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardHeader className="pt-8">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate flex items-center gap-2">
                          {collection.name}
                          {collection.symbol && (
                            <span className="text-sm text-muted-foreground font-normal">
                              ({collection.symbol})
                            </span>
                          )}
                        </CardTitle>
                        
                        {collection.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {collection.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    {collection.category && (
                      <Badge variant="outline" className={`w-fit ${getCategoryColor(collection.category)}`}>
                        {collection.category.charAt(0).toUpperCase() + collection.category.slice(1)}
                      </Badge>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                      <div className="flex items-center gap-4">
                        {collection.items_redeemed !== undefined && collection.max_supply && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {collection.items_redeemed}/{collection.max_supply}
                          </div>
                        )}
                        
                        {collection.mint_price && (
                          <div>
                            {collection.mint_price} SOL
                          </div>
                        )}
                      </div>
                    </div>

                    {/* External Links */}
                    {collection.external_links && collection.external_links.length > 0 && (
                      <div className="flex gap-2 pt-2">
                        {collection.external_links.slice(0, 3).map((link: any, index: number) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            asChild
                            className="p-1 h-8 w-8"
                          >
                            <a
                              href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`${link.type}: ${link.url}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={`/collection/${collection.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </a>
                      </Button>
                      <Button size="sm" className="flex-1" asChild>
                        <a href={`/mint?collection=${collection.slug || collection.id}`}>
                          <Plus className="w-4 h-4 mr-1" />
                          Create NFT
                        </a>
                      </Button>
                    </div>

                    {/* Minted Items Count */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Minted Items:</span>
                        <span className="font-medium">{collection.items_redeemed || 0}</span>
                      </div>
                      <div className="text-xs">
                        Created {formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Create New Collection CTA */}
          {collections.length > 0 && (
            <Card className="mt-8 text-center p-8 border-dashed">
              <div className="text-4xl mb-4">➕</div>
              <h3 className="text-xl font-semibold mb-2">Create Another Collection</h3>
              <p className="text-muted-foreground mb-4">
                Organize your NFTs by theme, style, or project
              </p>
              <Button asChild variant="outline">
                <a href="/mint">Create New Collection</a>
              </Button>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}