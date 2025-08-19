import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { 
  ArrowLeft,
  Plus, 
  ExternalLink,
  Eye,
  Verified,
  Settings,
  Calendar,
  Coins,
  Users,
  Image as ImageIcon,
  Heart
} from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { useCollectionMints } from "@/hooks/useCollectionMints";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { useFavorites } from "@/hooks/useFavorites";
import { formatDistanceToNow } from "date-fns";

export default function CollectionDetail() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { connected } = useSolanaWallet();
  const { collection, loading: collectionLoading } = useCollection(collectionId!);
  const { mints, loading: mintsLoading } = useCollectionMints(collectionId);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  if (collectionLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8" />
            <div className="h-64 bg-muted rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!collection) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-4">Collection Not Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              The collection you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/profile')}>
              Back to Profile
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{collection.name} - Collection Details</title>
        <meta name="description" content={`View ${collection.name} collection details and minted NFTs`} />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/profile">My Profile</a>
            </Button>
          </div>

          {/* Collection Banner */}
          <Card className="mb-8 overflow-hidden">
            <div className="relative">
              <AspectRatio ratio={3/1}>
                {collection.banner_image_url ? (
                  <img
                    src={collection.banner_image_url}
                    alt={`${collection.name} banner`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 w-full h-full flex items-center justify-center">
                    <div className="text-6xl opacity-50">🎨</div>
                  </div>
                )}
              </AspectRatio>
              
              {/* Square NFT Avatar Overlay */}
              <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 border-4 border-background rounded-lg overflow-hidden">
                  {collection.image_url ? (
                    <img
                      src={collection.image_url}
                      alt={`${collection.name} avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-semibold">
                      {collection.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="absolute top-4 right-4 flex gap-2">
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

            <CardContent className="pt-16">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{collection.name}</h1>
                    {collection.symbol && (
                      <Badge variant="outline" className="text-sm">
                        {collection.symbol}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (isFavorite(collection.id)) {
                          removeFromFavorites(collection.id);
                        } else {
                          addToFavorites({ id: collection.id, name: collection.name, image_url: collection.image_url, type: 'collection' });
                        }
                      }}
                      aria-label={isFavorite(collection.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite(collection.id) ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                  </div>
                  
                  {collection.description && (
                    <p className="text-muted-foreground mb-4 max-w-2xl">
                      {collection.description}
                    </p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{mints.length}</div>
                      <div className="text-sm text-muted-foreground">Minted</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{collection.max_supply || '∞'}</div>
                      <div className="text-sm text-muted-foreground">Max Supply</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{collection.mint_price || 0}</div>
                      <div className="text-sm text-muted-foreground">Price (SOL)</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{collection.royalty_percentage || 0}%</div>
                      <div className="text-sm text-muted-foreground">Royalties</div>
                    </div>
                  </div>

                  {/* External Links */}
                  {collection.external_links && collection.external_links.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {collection.external_links.map((link: any, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {link.type}
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  {connected && mints.length === 0 && (
                    <Button variant="outline" size="lg" asChild>
                      <a href={`/mint?edit=${collection.id}`}>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Collection
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Minted NFTs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Minted NFTs ({mints.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mintsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-muted rounded-t-lg" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : mints.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🖼️</div>
                  <h3 className="text-2xl font-semibold mb-4">No NFTs Minted Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start minting NFTs from this collection to see them here.
                  </p>
                  <Button asChild>
                    <a href={`/mint?collection=${collection.slug || collection.id}`}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First NFT
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mints.map((nft) => (
                    <Card key={nft.id} className="group hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                          {nft.image_url ? (
                            <img 
                              src={nft.image_url} 
                              alt={nft.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-16 h-16 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-4">
                          <div className="mb-2">
                            <h3 className="font-semibold line-clamp-1">{nft.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Owner: {nft.owner_address.slice(0, 8)}...{nft.owner_address.slice(-4)}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Minted {formatDistanceToNow(new Date(nft.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}