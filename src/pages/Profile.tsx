
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, CheckCircle, Edit2 } from 'lucide-react';
import { NFTCard } from '@/components/NFTCard';
import { CollectionCard } from '@/components/CollectionCard';
import { SearchFilterBar, FilterState } from '@/components/SearchFilterBar';
import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import { NicknameEditDialog } from '@/components/NicknameEditDialog';
import { BioEditDialog } from '@/components/BioEditDialog';
import { PfpPickerDialog } from '@/components/PfpPickerDialog';
import { BannerPickerDialog } from '@/components/BannerPickerDialog';
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useUserNFTs } from '@/hooks/useUserNFTs';
import { useCollections } from '@/hooks/useCollections';
import { useLikedNFTs } from '@/hooks/useLikedNFTs';
import { useLikedCollections } from '@/hooks/useLikedCollections';
import { useCreatorFollows } from '@/hooks/useCreatorFollows';
import { useNFTLikeCounts, useCollectionLikeCounts } from '@/hooks/useLikeCounts';
import { useFilteredNFTs, useFilteredCollections } from "@/hooks/useFilteredData";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setNavContext } from "@/lib/navContext";

const Profile = () => {
  const { wallet } = useParams();
  const { publicKey, connected } = useSolanaWallet();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [showBioDialog, setShowBioDialog] = useState(false);
  const [showPfpDialog, setShowPfpDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);

  const targetWallet = wallet || publicKey;

  // Data hooks
  const { nfts, loading: nftsLoading, fetchUserNFTs } = useUserNFTs();
  const { collections, loading: collectionsLoading } = useCollections();
  const { likedNFTs } = useLikedNFTs();
  const { likedCollections } = useLikedCollections();
  const { followedCreators } = useCreatorFollows();
  const { getLikeCount: getNFTLikeCount } = useNFTLikeCounts();
  const { getLikeCount: getCollectionLikeCount } = useCollectionLikeCounts();

  // Filter states
  const [nftFilters, setNftFilters] = useState<FilterState>({
    searchQuery: '',
    source: 'all',
    sortBy: 'newest',
    includeExplicit: false,
    category: 'all',
    minPrice: '',
    maxPrice: '',
    minRoyalty: '',
    maxRoyalty: '',
    listing: 'all'
  });

  const [collectionFilters, setCollectionFilters] = useState<FilterState>({
    searchQuery: '',
    source: 'all',
    sortBy: 'newest',
    includeExplicit: false,
    category: 'all',
    minPrice: '',
    maxPrice: '',
    minRoyalty: '',
    maxRoyalty: ''
  });

  useEffect(() => {
    setIsOwnProfile(connected && targetWallet === publicKey);
  }, [connected, targetWallet, publicKey]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetWallet) {
        // No wallet connected or provided via URL -> show connect message
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-profile', {
          body: { wallet_address: targetWallet }
        });
        
        if (error) {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load profile');
          return;
        }
        
        setProfile(data?.profile || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetWallet]);

  // Get collections created by this user
  const userCollections = useMemo(() => {
    return collections.filter(collection => 
      collection.creator_address === targetWallet && collection.is_active
    );
  }, [collections, targetWallet]);

  // Get NFTs and Collections from liked creators
  const nftsFromLikedCreators = useMemo(() => {
    return nfts.filter(nft => followedCreators.includes(nft.creator_address));
  }, [nfts, followedCreators]);

  const collectionsFromLikedCreators = useMemo(() => {
    return userCollections.filter(collection => 
      followedCreators.includes(collection.creator_address)
    );
  }, [userCollections, followedCreators]);

  // Apply filters - Convert UserNFT to NFT format
  const nftsForFiltering = nfts.map(nft => ({
    id: nft.id,
    name: nft.name,
    description: nft.description,
    is_listed: nft.is_listed || false,
    creator_address: nft.creator_address || targetWallet || '',
    created_at: nft.created_at || new Date().toISOString(),
    category: undefined,
    price: nft.price,
    attributes: undefined
  }));

  // Also map likedNFTs to include created_at
  const likedNFTsForFiltering = likedNFTs.map(nft => ({
    ...nft,
    created_at: new Date().toISOString()
  }));

  // Map nftsFromLikedCreators to NFT format
  const nftsFromLikedCreatorsForFiltering = nftsFromLikedCreators.map(nft => ({
    id: nft.id,
    name: nft.name,
    description: nft.description,
    is_listed: nft.is_listed || false,
    creator_address: nft.creator_address || '',
    created_at: nft.created_at || new Date().toISOString(),
    category: undefined,
    price: nft.price,
    attributes: undefined
  }));

  const filteredNFTs = useFilteredNFTs(
    nftsForFiltering,
    likedNFTsForFiltering,
    nftsFromLikedCreatorsForFiltering,
    followedCreators,
    nftFilters,
    getNFTLikeCount
  );

  // Convert collections to include created_at for filtering
  const collectionsForFiltering = userCollections.map(collection => ({
    ...collection,
    created_at: collection.created_at || new Date().toISOString()
  }));

  const likedCollectionsForFiltering = likedCollections.map(collection => ({
    ...collection,
    created_at: new Date().toISOString()
  }));

  const filteredCollections = useFilteredCollections(
    collectionsForFiltering,
    likedCollectionsForFiltering,
    collectionsFromLikedCreators,
    followedCreators,
    collectionFilters,
    getCollectionLikeCount
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!targetWallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="py-10 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your Solana wallet to view and customize your profile.
            </p>
            <SolanaWalletButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-64 bg-gradient-to-br from-purple-600/80 to-purple-800/80 rounded-lg overflow-hidden">
          {profile?.banner_image_url && (
            <img 
              src={profile.banner_image_url} 
              alt="Profile Banner" 
              className="w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white border-white/20"
              onClick={() => setShowBannerDialog(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Banner
            </Button>
          )}
        </div>

        {/* Profile Content */}
        <div className="relative -mt-20 px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-background bg-muted-foreground/20 overflow-hidden backdrop-blur-sm">
                {profile?.profile_image_url ? (
                  <img 
                    src={profile.profile_image_url} 
                    alt="Profile Picture" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20 text-3xl font-bold text-foreground">
                    {targetWallet?.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-1 -right-1 rounded-full w-8 h-8"
                  onClick={() => setShowPfpDialog(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-3 mt-4">
              {/* Name & Edit */}
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile?.display_name || profile?.nickname || `${targetWallet?.slice(0, 4)}...${targetWallet?.slice(-4)}`}
                </h1>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowNicknameDialog(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-1"
                >
                  {targetWallet?.slice(0, 2).toUpperCase()}
                </Badge>
              </div>

              {/* Full Wallet Address */}
              <p className="font-mono text-sm text-muted-foreground">
                {targetWallet}
              </p>

              {/* Bio Section */}
              <div>
                {profile?.bio ? (
                  <div className="flex items-start gap-2">
                    <p className="text-muted-foreground">{profile.bio}</p>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="icon" 
                        className="h-6 w-6 mt-1"
                        onClick={() => setShowBioDialog(true)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ) : isOwnProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBioDialog(true)}
                    className="text-sm"
                  >
                    Add Bio
                  </Button>
                ) : null}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-1 text-sm">
                <Badge variant="secondary" className="text-xs">
                  {targetWallet?.slice(0, 4)}...{targetWallet?.slice(-4)}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <UserProfileDisplay
                  walletAddress={targetWallet}
                  showRankBadge={false}
                  showTradeCount={true}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <Tabs defaultValue="collections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="collections">
            My Collections ({userCollections.length})
          </TabsTrigger>
          <TabsTrigger value="nfts">
            My NFTs ({nfts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="space-y-6">
          <SearchFilterBar
            filters={collectionFilters}
            onFiltersChange={setCollectionFilters}
            showListingFilter={false}
            showSourceFilter={isOwnProfile}
            showPriceFilters={true}
            showRoyaltyFilters={true}
            placeholder="Search collections..."
            categories={['Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Utility', 'Other']}
          />

          {collectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCollections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCollections.map((collection) => (
                 <CollectionCard
                   key={collection.id}
                   collection={{
                     id: collection.id,
                     name: collection.name,
                     image_url: '/placeholder.svg',
                     creator_address_masked: collection.creator_address || '',
                     mint_price: collection.mint_price,
                     items_redeemed: 0,
                     verified: false,
                     description: collection.description
                   }}
                   onNavigate={() => setNavContext({ 
                     type: 'collection', 
                     items: filteredCollections.map(c => c.id), 
                     source: 'profile',
                     tab: 'collections'
                   })}
                 />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {collectionFilters.searchQuery || collectionFilters.source !== 'all'
                    ? 'No collections match your filters'
                    : isOwnProfile
                    ? 'You haven\'t created any collections yet'
                    : 'This user hasn\'t created any collections yet'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nfts" className="space-y-6">
          <SearchFilterBar
            filters={nftFilters}
            onFiltersChange={setNftFilters}
            showListingFilter={isOwnProfile}
            showSourceFilter={isOwnProfile}
            showPriceFilters={true}
            showRoyaltyFilters={false}
            placeholder="Search NFTs..."
            categories={['Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Utility', 'Other']}
          />

          {nftsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNFTs.map((nft) => (
                 <NFTCard
                   key={nft.id}
                   nft={{
                     id: nft.id,
                     name: nft.name,
                     image_url: '/placeholder.svg',
                     owner_address: targetWallet || '',
                     mint_address: nft.id,
                     creator_address: targetWallet || '',
                     price: nft.price,
                     is_listed: nft.is_listed || false,
                     collection_id: undefined,
                     description: nft.description,
                     attributes: undefined,
                     collections: undefined
                   }}
                   showOwnerInfo={false}
                   onNavigate={() => setNavContext({ 
                     type: 'nft', 
                     items: filteredNFTs.map(n => n.id), 
                     source: 'profile',
                     tab: 'nfts'
                   })}
                 />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {nftFilters.searchQuery || nftFilters.source !== 'all' || nftFilters.listing !== 'all'
                    ? 'No NFTs match your filters'
                    : isOwnProfile
                    ? 'You don\'t own any NFTs yet'
                    : 'This user doesn\'t own any NFTs yet'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialogs */}
      {isOwnProfile && (
        <>
          <NicknameEditDialog
            open={showNicknameDialog}
            onOpenChange={setShowNicknameDialog}
            profile={profile}
            currentNickname={profile?.display_name || ''}
            onConfirm={async (newNickname) => {
              setProfile(prev => ({ ...prev, display_name: newNickname }));
              return true;
            }}
          />

          <BioEditDialog
            open={showBioDialog}
            onOpenChange={setShowBioDialog}
            profile={profile}
            currentBio={profile?.bio || ''}
            onConfirm={async (newBio) => {
              setProfile(prev => ({ ...prev, bio: newBio }));
              return true;
            }}
          />

          <PfpPickerDialog
            open={showPfpDialog}
            onOpenChange={setShowPfpDialog}
            profile={profile}
            nfts={nfts}
            onConfirm={async (mintAddress) => {
              setProfile(prev => ({ ...prev, current_pfp_nft_mint_address: mintAddress }));
              return true;
            }}
          />

          <BannerPickerDialog
            open={showBannerDialog}
            onOpenChange={setShowBannerDialog}
            profile={profile}
            onConfirm={async (file) => {
              // Handle file upload logic here
              setProfile(prev => ({ ...prev, banner_image_url: URL.createObjectURL(file) }));
              return true;
            }}
          />
        </>
      )}
    </div>
  );
};

export default Profile;
