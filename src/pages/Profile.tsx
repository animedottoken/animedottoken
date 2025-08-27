
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
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useUserNFTs } from '@/hooks/useUserNFTs';
import { useCollections } from '@/hooks/useCollections';
import { useLikedNFTs } from '@/hooks/useLikedNFTs';
import { useLikedCollections } from '@/hooks/useLikedCollections';
import { useCreatorFollows } from '@/hooks/useCreatorFollows';
import { useNFTLikeCounts, useCollectionLikeCounts } from '@/hooks/useLikeCounts';
import { useFilteredNFTs, useFilteredCollections } from '@/hooks/useFilteredData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    category: '',
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
    category: '',
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
      if (!targetWallet) return;
      
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

  // Apply filters
  const filteredNFTs = useFilteredNFTs(
    nfts,
    likedNFTs,
    nftsFromLikedCreators,
    followedCreators,
    nftFilters,
    getNFTLikeCount
  );

  const filteredCollections = useFilteredCollections(
    userCollections,
    likedCollections,
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
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground">
          Connect your wallet to view profile
        </h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <UserProfileDisplay
            profile={profile}
            walletAddress={targetWallet}
            isOwnProfile={isOwnProfile}
            onEditNickname={() => setShowNicknameDialog(true)}
            onEditBio={() => setShowBioDialog(true)}
            onEditPfp={() => setShowPfpDialog(true)}
            onEditBanner={() => setShowBannerDialog(true)}
          />
        </CardContent>
      </Card>

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
                  collection={collection}
                  showOwnerInfo={!isOwnProfile}
                  likeCount={getCollectionLikeCount(collection.id)}
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
                  nft={nft}
                  showOwnerInfo={!isOwnProfile}
                  navigationQuery="from=profile"
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
            currentNickname={profile?.display_name || ''}
            onSuccess={(newNickname) => {
              setProfile(prev => ({ ...prev, display_name: newNickname }));
            }}
          />

          <BioEditDialog
            open={showBioDialog}
            onOpenChange={setShowBioDialog}
            currentBio={profile?.bio || ''}
            onSuccess={(newBio) => {
              setProfile(prev => ({ ...prev, bio: newBio }));
            }}
          />

          <PfpPickerDialog
            open={showPfpDialog}
            onOpenChange={setShowPfpDialog}
            onSuccess={(pfpUrl) => {
              setProfile(prev => ({ ...prev, profile_image_url: pfpUrl }));
            }}
          />

          <BannerPickerDialog
            open={showBannerDialog}
            onOpenChange={setShowBannerDialog}
            onSuccess={(bannerUrl) => {
              setProfile(prev => ({ ...prev, banner_image_url: bannerUrl }));
            }}
          />
        </>
      )}
    </div>
  );
};

export default Profile;
