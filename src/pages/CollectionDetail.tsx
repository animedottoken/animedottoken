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
  Flame,
  Play,
  Pause,
  Zap
} from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { useCollectionMints } from "@/hooks/useCollectionMints";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { useCollections } from "@/hooks/useCollections";

import { CollectionEditor } from "@/components/CollectionEditor";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useDeleteCollection } from "@/hooks/useDeleteCollection";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { truncateAddress } from "@/utils/addressUtils";
import { UserProfileDisplay } from "@/components/UserProfileDisplay";
import { CollectionAvatarDialog } from "@/components/CollectionAvatarDialog";
import { CollectionBannerDialog } from "@/components/CollectionBannerDialog";
import { ProfileStyleEditButton } from "@/components/ProfileStyleEditButton";

export default function CollectionDetail() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromFavorites = searchParams.get('from') === 'favorites';
  const { connected, publicKey } = useSolanaWallet();
  const { collection, loading: collectionLoading, refreshCollection } = useCollection(collectionId!);
  const { mints, loading: mintsLoading } = useCollectionMints(collectionId);
  const { deleting, deleteCollection } = useDeleteCollection();
  
  // Get user's collections for reliable ownership checking
  const { collections } = useCollections({ autoLoad: !!publicKey });
  
  // Find the owned collection (unmasked) for reliable ownership checking
  const ownedCollection = collections.find(c => c.id === collectionId);
  const isOwner = connected && ownedCollection !== undefined;
  
  // Use refreshed collection data but preserve unmasked creator_address for editing
  const displayCollection = collection;
  // Create merged data for editor with unmasked creator_address
  const editorCollection = ownedCollection && collection ? { ...collection, creator_address: ownedCollection.creator_address, treasury_wallet: ownedCollection.treasury_wallet } : collection;
  
  
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

  // Dialog states for editing avatar and banner
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);

  // Real creator wallet address (unmasked)
  const [creatorWallet, setCreatorWallet] = useState<string>('');
  
  // Navigation context for moving between collections
  const navigation = useNavigationContext(collectionId!, 'collection');

  // Fetch real creator wallet address for profile linking
  useEffect(() => {
    const fetchCreatorWallet = async () => {
      if (!collectionId) return;
      
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('creator_address')
          .eq('id', collectionId)
          .single();

        if (!error && data) {
          setCreatorWallet(data.creator_address);
        }
      } catch (err) {
        console.error('Error fetching creator wallet:', err);
      }
    };

    fetchCreatorWallet();
  }, [collectionId]);

  // Auto-scroll to editor when ?edit=1 is present (no blocking/error messaging)
  useEffect(() => {
    const wantsEdit = searchParams.get('edit');
    if (wantsEdit && displayCollection && isOwner) {
      setTimeout(() => {
        const el = document.getElementById('collection-editor');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [displayCollection, connected, publicKey, searchParams, isOwner]);

  const handleCollectionUpdate = (updatedCollection: any) => {
    // Refresh collection data to get latest version (silent to prevent scroll jump)
    refreshCollection(true);
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
        <title>{displayCollection?.name || 'Collection'} - Collection Details</title>
        <meta name="description" content={`View ${displayCollection?.name || 'Collection'} collection details and minted NFTs`} />
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
              <AspectRatio ratio={4/1}>
                {displayCollection?.banner_image_url ? (
                  <img
                    src={displayCollection.banner_image_url}
                    alt={`${displayCollection.name} banner`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 w-full h-full flex items-center justify-center">
                    <div className="text-6xl opacity-50">🎨</div>
                  </div>
                )}
              </AspectRatio>

              {/* Banner Edit Button - Profile Style */}
              {isOwner && (
                <div className="absolute top-4 right-4">
                  <ProfileStyleEditButton
                    onClick={() => setShowBannerDialog(true)}
                     tooltipContent={
                       ((displayCollection?.items_redeemed || 0) > 0) 
                         ? "Change banner (2 USDT in ANIME)" 
                         : "Change banner (possible until minted)"
                     }
                  />
                </div>
              )}
              
              {/* Square NFT Avatar Overlay */}
              <div className="absolute -bottom-12 left-8 group">
                <div className="w-24 h-24 border-4 border-background rounded-lg overflow-hidden relative">
                  {displayCollection?.image_url ? (
                    <img
                      src={displayCollection.image_url}
                      alt={`${displayCollection.name} avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-semibold">
                      {displayCollection?.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Avatar Edit Button - Profile Style */}
                  {isOwner && ((displayCollection?.items_redeemed || 0) === 0) && (
                    <div className="absolute -bottom-1 -right-1">
                      <ProfileStyleEditButton
                        onClick={() => setShowAvatarDialog(true)}
                        tooltipContent="Change avatar (possible until minted)"
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="pt-16">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold">{displayCollection?.name}</h1>
                      {displayCollection?.symbol && (
                        <Badge variant="outline" className="text-sm">
                          {displayCollection.symbol}
                        </Badge>
                      )}
                      
                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        {/* On-chain vs Off-chain status */}
                        {(displayCollection?.collection_mint_address || displayCollection?.verified) ? (
                          <Badge variant="default" className="bg-green-500 text-white text-xs">
                            On-chain
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Off-chain
                          </Badge>
                        )}
                        
                        {displayCollection?.verified && (
                          <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                            <Verified className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        
                        {/* Collection Status */}
                        {displayCollection?.is_live ? (
                          <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                            ● Live
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-500 text-white text-xs">
                            ⏸ Paused
                          </Badge>
                        )}
                        
                        {/* Minting Progress */}
                        {displayCollection?.max_supply && (
                          <Badge variant="outline" className="text-xs">
                            {mints.length}/{displayCollection.max_supply}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Creator Info */}
                    {creatorWallet && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Creator</div>
                        <Link 
                          to={`/profile/${creatorWallet}`}
                          className="block hover:opacity-80 transition-opacity w-fit"
                        >
                          <div className="flex items-center gap-3">
                            <UserProfileDisplay 
                              walletAddress={creatorWallet} 
                              size="sm" 
                              showRankBadge={false}
                            />
                            <span className="text-sm text-muted-foreground">
                              {truncateAddress(creatorWallet)}
                            </span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                    {/* Owner Action Buttons */}
                   {isOwner && (
                     <div className="flex gap-1">
                       
                       <Button
                         variant={displayCollection?.is_live ? "outline" : "default"}
                         size="sm"
                         onClick={async () => {
                           try {
                             const { data, error } = await supabase.functions.invoke('update-collection', {
                               body: {
                                 collection_id: displayCollection?.id,
                                 updates: { is_live: !displayCollection?.is_live }
                               }
                             });
                             
                              if (data?.success) {
                                refreshCollection(true);
                                toast.success(
                                  displayCollection?.is_live ? 'Collection paused' : 'Collection is now LIVE!',
                                  {
                                    description: displayCollection?.is_live ? 'Minting has been paused' : 'Users can now mint NFTs'
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
                         {displayCollection?.is_live ? (
                           <><Pause className="w-3 h-3 mr-1" />Pause</>
                         ) : (
                           <><Play className="w-3 h-3 mr-1" />Start</>
                         )}
                       </Button>
                      
                      {(!displayCollection?.collection_mint_address && !displayCollection?.verified) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            if (!publicKey) return;
                            try {
                              const { data: mintResult, error: mintError } = await supabase.functions.invoke('mint-collection', {
                                body: {
                                  collectionId: displayCollection?.id,
                                  creatorAddress: publicKey
                                }
                              });
                              if (mintError || !mintResult?.success) {
                                toast.error('Failed to mint collection on-chain');
                              } else {
                                toast.success('Collection minted successfully on-chain! 🎉');
                                refreshCollection(true);
                              }
                            } catch (error) {
                              toast.error('Failed to mint collection on-chain');
                            }
                          }}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Mint On-Chain
                        </Button>
                      )}
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (mints.length > 0) {
                            // Burn all NFTs
                            setConfirmDialog({
                              open: true,
                              title: 'Burn All NFTs',
                              description: `Are you sure you want to burn all ${mints.length} NFTs in "${displayCollection?.name}"? This action cannot be undone and will permanently destroy all NFTs in this collection.`,
                              onConfirm: async () => {
                                setConfirmDialog(prev => ({ ...prev, loading: true }));
                                
                                try {
                                  const { data, error } = await supabase.functions.invoke('burn-nft', {
                                    body: {
                                      collection_id: displayCollection?.id,
                                      wallet_address: publicKey,
                                      burn_all: true
                                    }
                                  });
                                  
                                  if (data?.success) {
                                    toast.success('All NFTs burned successfully');
                                    window.location.reload();
                                  } else {
                                    toast.error(data?.error || 'Failed to burn NFTs');
                                  }
                                } catch (error) {
                                  console.error('Error burning all NFTs:', error);
                                  toast.error('Failed to burn NFTs');
                                } finally {
                                  setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
                                }
                              }
                            });
                          } else {
                            // Delete collection
                            setConfirmDialog({
                              open: true,
                              title: 'Delete Collection',
                              description: `Are you sure you want to delete "${displayCollection?.name}"? This action cannot be undone and will permanently remove the collection from the blockchain.`,
                              onConfirm: async () => {
                                setConfirmDialog(prev => ({ ...prev, loading: true }));
                                
                                try {
                                  const result = await deleteCollection(displayCollection?.id || '', displayCollection?.name || '');
                                  if (result.success) {
                                    const backUrl = navigation.source === 'favorites' 
                                      ? '/profile?tab=favorites' 
                                      : navigation.source === 'collections' 
                                      ? '/profile?tab=collections' 
                                      : navigation.source === 'marketplace'
                                      ? '/marketplace'
                                      : '/profile';
                                    navigate(backUrl);
                                  }
                                } catch (error) {
                                  console.error('Error deleting collection:', error);
                                  toast.error('Failed to delete collection');
                                } finally {
                                  setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
                                }
                              }
                            });
                          }
                        }}
                      >
                        <Flame className="w-3 h-3 mr-1" />
                        Burn
                      </Button>
                    </div>
                  )}
                </div>
                
                {displayCollection?.description && (
                  <p className="text-muted-foreground mb-4 max-w-2xl">
                    {displayCollection.description}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{mints.length}</div>
                    <div className="text-sm text-muted-foreground">Minted</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{displayCollection?.max_supply || '∞'}</div>
                    <div className="text-sm text-muted-foreground">Max Supply</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{displayCollection?.mint_price || 0}</div>
                    <div className="text-sm text-muted-foreground">Price (SOL)</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{displayCollection?.royalty_percentage || 0}%</div>
                    <div className="text-sm text-muted-foreground">Royalties</div>
                  </div>
                </div>

                {/* External Links */}
                {displayCollection?.external_links && Array.isArray(displayCollection.external_links) && displayCollection.external_links.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {(displayCollection.external_links as any[]).map((link: any, index: number) => (
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
            </CardContent>
          </Card>

          {/* Collection Editor - Always show for collection owner */}
          {isOwner && editorCollection && (
            <div id="collection-editor" className="mb-8">
            <CollectionEditor 
              collection={editorCollection} 
              mints={mints}
              onRefreshCollection={() => refreshCollection(true)}
              startInEditMode={searchParams.get('edit') === '1'}
              onClose={() => {
                // Remove edit parameter from URL
                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.delete('edit');
                const queryString = newSearchParams.toString();
                navigate(queryString ? `?${queryString}` : window.location.pathname, { replace: true });
                // Refresh the page data after closing editor
                handleCollectionUpdate(editorCollection);
              }}
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
                    <Link to={`/mint?collection=${displayCollection?.slug || displayCollection?.id}`}>
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

        {/* Avatar Edit Dialog */}
        <CollectionAvatarDialog
          open={showAvatarDialog}
          onOpenChange={setShowAvatarDialog}
          collectionId={collectionId!}
          currentUrl={displayCollection?.image_url}
          onSaved={() => refreshCollection(true)}
          isMinted={(displayCollection?.items_redeemed || 0) > 0}
        />

        {/* Banner Edit Dialog */}
        <CollectionBannerDialog
          open={showBannerDialog}
          onOpenChange={setShowBannerDialog}
          collectionId={collectionId!}
          currentUrl={displayCollection?.banner_image_url}
          onSaved={() => refreshCollection(true)}
          isMinted={(displayCollection?.items_redeemed || 0) > 0}
        />
      </main>
    </>
  );
}