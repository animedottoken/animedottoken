import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus, 
  ExternalLink,
  Eye,
  Verified,
  Settings,
  Calendar,
  Coins,
  Users,
  Image as ImageIcon,
  Heart,
  Trash2,
  Flame
} from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { useCollectionMints } from "@/hooks/useCollectionMints";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";

import { CollectionEditor } from "@/components/CollectionEditor";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useDeleteCollection } from "@/hooks/useDeleteCollection";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { truncateAddress } from "@/utils/addressUtils";

export default function CollectionDetail() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromFavorites = searchParams.get('from') === 'favorites';
  const { connected, publicKey } = useSolanaWallet();
  const { collection, loading: collectionLoading, refreshCollection } = useCollection(collectionId!);
  const { mints, loading: mintsLoading } = useCollectionMints(collectionId);
  const { deleting, deleteCollection } = useDeleteCollection();
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    loading?: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  
  // Navigation context for moving between collections
  const navigation = useNavigationContext(collectionId!, 'collection');

  // Auto-scroll to editor when ?edit=1 is present (no blocking/error messaging)
  useEffect(() => {
    const wantsEdit = searchParams.get('edit');
    if (!wantsEdit || !collection) return;

    const el = document.getElementById('collection-editor');
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
    // Note: The editor itself is shown only to the owner; we don't block or show errors here.
  }, [collection, connected, publicKey, searchParams]);

  const handleCollectionUpdate = (updatedCollection: any) => {
    // Refresh collection data to get latest version
    refreshCollection();
  };

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
            <Button onClick={() => {
              const backUrl = navigation.source === 'favorites' 
                ? '/profile?tab=favorites' 
                : navigation.source === 'collections' 
                ? '/profile?tab=collections' 
                : navigation.source === 'marketplace'
                ? '/marketplace'
                : '/profile';
              navigate(backUrl);
            }}>
              Back to {navigation.source === 'favorites' ? 'Favorites' : navigation.source === 'collections' ? 'Collections' : navigation.source === 'marketplace' ? 'Marketplace' : 'Profile'}
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
            <Button variant="ghost" size="sm" onClick={() => {
              const tab = searchParams.get('tab') || (navigation.source === 'collections' ? 'collections' : 'nfts');
              const backUrl = navigation.source === 'favorites' 
                ? '/profile?tab=favorites' 
                : navigation.source === 'collections' 
                ? '/profile?tab=collections' 
                : navigation.source === 'marketplace'
                ? `/marketplace?tab=${tab}`
                : '/profile';
              navigate(backUrl);
            }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {navigation.source === 'favorites' ? 'Favorites' : navigation.source === 'collections' ? 'Collections' : navigation.source === 'marketplace' ? 'Marketplace' : 'Profile'}
            </Button>
            
            {/* Navigation arrows */}
            {navigation.canNavigate && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigation.navigatePrev}
                  disabled={!navigation.hasPrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {navigation.currentIndex} of {navigation.totalItems}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigation.navigateNext}
                  disabled={!navigation.hasNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
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
                  {collection.external_links && Array.isArray(collection.external_links) && collection.external_links.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {(collection.external_links as any[]).map((link: any, index: number) => (
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
                  {/* Collection Owner Controls - Only show for owned collections */}
                  {connected && publicKey === collection.creator_address && (
                    <Button
                      variant={collection.is_live ? "destructive" : "default"}
                      size="lg"
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('update-collection', {
                            body: {
                              collection_id: collection.id,
                              updates: { is_live: !collection.is_live }
                            }
                          });
                          
                          if (data?.success) {
                            // Refresh collection to show updated status
                            refreshCollection();
                            toast.success(
                              collection.is_live ? 'Collection paused' : 'Collection is now LIVE!',
                              {
                                description: collection.is_live ? 'Minting has been paused' : 'Users can now mint NFTs'
                              }
                            );
                          } else {
                            toast.error('Failed to update collection status');
                          }
                        } catch (error) {
                          toast.error('Failed to update collection status');
                        }
                      }}
                    >
                      {collection.is_live ? 'Pause Minting' : 'Go Live'}
                    </Button>
                  )}
                  
                  {connected && publicKey === collection.creator_address && (
                    <>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => {
                          document.getElementById('collection-editor')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Collection
                      </Button>
                      
                      {mints.length === 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="lg"
                              disabled={deleting}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Collection
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{collection.name}"? This action cannot be undone and will permanently remove the collection from the blockchain.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  const result = await deleteCollection(collection.id, collection.name);
                                  if (result.success) {
                                   const backUrl = navigation.source === 'favorites' 
                                    ? '/profile?tab=favorites' 
                                    : navigation.source === 'collections' 
                                    ? '/profile?tab=collections' 
                                    : navigation.source === 'marketplace'
                                    ? '/marketplace'
                                    : '/profile';
                                  // Don't save scroll position since we're going to a different page
                                  navigate(backUrl);
                                  }
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleting}
                              >
                                {deleting ? 'Deleting...' : 'Delete Collection'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Editor - Only show for collection owner */}
          {connected && publicKey === collection.creator_address && (
            <div id="collection-editor" className="mb-8">
              <CollectionEditor 
                collection={collection as any}
                onClose={() => {}}
              />
            </div>
          )}

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
                    <Link to={`/mint?collection=${collection.slug || collection.id}`}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First NFT
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mints.map((nft) => (
                     <Card 
                      key={nft.id} 
                      className="group hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        const navIds = mints.map(mint => mint.id);
                        const source = navigation.source || 'collection';
                        const queryString = `from=${source}&nav=${encodeURIComponent(JSON.stringify(navIds))}`;
                        navigate(`/nft/${nft.id}?${queryString}`);
                      }}
                    >
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
                              Owner: {truncateAddress(nft.owner_address)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Minted {formatDistanceToNow(new Date(nft.created_at), { addSuffix: true })}
                            </div>
                            {connected && publicKey === nft.owner_address && (
                               <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click when burning
                                  setConfirmDialog({
                                    open: true,
                                    title: 'Burn NFT',
                                    description: `Are you sure you want to burn "${nft.name}"? This action cannot be undone and will permanently destroy the NFT.`,
                                    onConfirm: async () => {
                                      setConfirmDialog(prev => ({ ...prev, loading: true }));
                                      
                                      try {
                                        const { data, error } = await supabase.functions.invoke('burn-nft', {
                                          body: {
                                            nft_id: nft.id,
                                            wallet_address: publicKey
                                          }
                                        });
                                        
                                        if (data?.success) {
                                          toast.success('NFT burned successfully');
                                          // Refresh the page to update the mints list
                                          window.location.reload();
                                        } else {
                                          toast.error(data?.error || 'Failed to burn NFT');
                                        }
                                      } catch (error) {
                                        console.error('Error burning NFT:', error);
                                        toast.error('Failed to burn NFT');
                                      } finally {
                                        setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
                                      }
                                    }
                                  });
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Flame className="w-3 h-3" />
                              </Button>
                            )}
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
        
        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText="Confirm"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={confirmDialog.onConfirm}
          loading={confirmDialog.loading}
        />
      </main>
    </>
  );
}