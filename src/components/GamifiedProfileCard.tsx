import { useState, useEffect } from 'react';
import { Edit, Crown, Lock, Image, DollarSign, Info, Heart, UserPlus, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGamifiedProfile } from '@/hooks/useGamifiedProfile';
import { useAnimePricing } from '@/hooks/useAnimePricing';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { truncateAddress } from '@/utils/addressUtils';
import { useCreatorFollowsByUser } from '@/hooks/useCreatorFollowsByUser';
import { useRealtimeCreatorStatsByUser } from '@/hooks/useRealtimeCreatorStatsByUser';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
export const GamifiedProfileCard = () => {
  const { publicKey } = useSolanaWallet();
  const {
    profile,
    userNFTs,
    loading,
    setNickname,
    setPFP,
    setBio,
    setAvatar,
    updateAssetCounts,
    getRankColor,
    getRankBadge
  } = useGamifiedProfile();

  const { isFollowingUserId, toggleFollowByUserId, loading: followLoading } = useCreatorFollowsByUser();

  // Use real-time creator stats
  const { getCreatorFollowerCount, getCreatorTotalLikeCount } = useRealtimeCreatorStatsByUser(
    profile?.user_id ? [profile.user_id] : []
  );
  
  const [nftCount, setNftCount] = useState(0);
  const [collectionCount, setCollectionCount] = useState(0);

  const nicknamePricing = useAnimePricing(0.00004); // ~1 ANIME for testing
  const pfpPricing = useAnimePricing(0.00004); // ~1 ANIME for testing
  const bioPricing = useAnimePricing(0.00004); // ~1 ANIME for testing

  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [pfpDialogOpen, setPfpDialogOpen] = useState(false);
  const [pfpConfirmDialogOpen, setPfpConfirmDialogOpen] = useState(false);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);
  const [selectedNftForPfp, setSelectedNftForPfp] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [bioInput, setBioInput] = useState('');

  // Fetch NFT and collection counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!profile?.wallet_address) return;
      
      try {
        // Get NFT count via public RPC (masked creator address)
        const masked = `${profile.wallet_address.slice(0,4)}...${profile.wallet_address.slice(-4)}`;
        const { data: publicNfts } = await supabase.rpc('get_nfts_public');
        const nftCount = (publicNfts || []).filter((n: any) => n.creator_address_masked === masked).length;
        
        // Get collection count via public RPC (masked creator address)
        const { data: publicCollections } = await supabase.rpc('get_collections_public_masked');
        const collectionCount = (publicCollections || []).filter((c: any) => c.creator_address_masked === masked).length;
        
        setNftCount(nftCount || 0);
        setCollectionCount(collectionCount || 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
        setNftCount(0);
        setCollectionCount(0);
      }
    };

    fetchCounts();
  }, [profile?.wallet_address]);

  const handleAvatarClick = () => {
    if (!profile) return;
    setPfpDialogOpen(true);
  };

  const handleNicknameTitleClick = () => {
    if (!profile) return;
    setNicknameInput(profile.nickname || '');
    setNicknameDialogOpen(true);
  };

  const handleBioClick = () => {
    if (!profile) return;
    setBioInput(profile.bio || '');
    setBioDialogOpen(true);
  };

  const handleSetNickname = async () => {
    if (!nicknameInput.trim()) {
      toast.error('Please enter a nickname');
      return;
    }

    // Check if this is first time (free) or requires payment
    const isFirstTime = !profile?.nickname;
    
    // Format large numbers with spaces
    const formatTokenAmount = (amount: number) => {
      return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    let testTransactionSignature = '';
    
    if (!isFirstTime) {
      // TEST MODE: Simulate payment without real transaction
      testTransactionSignature = `test_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Show payment simulation
      toast.success(`🎯 TEST PAYMENT SIMULATION 🎯`);
      toast.info(`Paying: ${formatTokenAmount(nicknamePricing.animeAmount)} $ANIME ≈ ${nicknamePricing.usdPrice.toFixed(2)} USDT`, {
        duration: 3000
      });
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      testTransactionSignature = `free_first_time_${Date.now()}`;
      toast.success('🎉 First nickname is free!');
    }
    
    const success = await setNickname(nicknameInput.trim(), testTransactionSignature);
    if (success) {
      setNicknameDialogOpen(false);
      setNicknameInput('');
      if (isFirstTime) {
        toast.success('✅ Nickname set successfully! (First time free)');
      } else {
        toast.success('✅ Nickname set successfully! (Test mode - no real payment)');
      }
    }
  };

  const handleNftClick = (nftMintAddress: string) => {
    // Select inside the same dialog; we'll show an inline confirmation bar
    setSelectedNftForPfp(nftMintAddress);
  };

  const handleConfirmPFP = async () => {
    if (!selectedNftForPfp) return;
    
    // Check if this is first time (free) or requires payment
    const isFirstTime = !profile?.pfp_unlock_status && !profile?.profile_image_url;
    
    // Format large numbers with spaces
    const formatTokenAmount = (amount: number) => {
      return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    let testTransactionSignature = '';
    
    if (!isFirstTime) {
      // TEST MODE: Simulate payment without real transaction
      testTransactionSignature = `test_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Show payment simulation
      toast.success(`🎯 TEST PAYMENT SIMULATION 🎯`);
      toast.info(`Paying: ${formatTokenAmount(pfpPricing.animeAmount)} $ANIME ≈ ${pfpPricing.usdPrice.toFixed(2)} USDT`, {
        duration: 3000
      });
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      testTransactionSignature = `free_first_time_${Date.now()}`;
      toast.success('🎉 First profile picture is free!');
    }
    
    const success = await setPFP(selectedNftForPfp, testTransactionSignature);
    if (success) {
      setPfpDialogOpen(false);
      setPfpConfirmDialogOpen(false);
      setSelectedNftForPfp(null);
      if (isFirstTime) {
        toast.success('✅ Profile picture set successfully! (First time free)');
      } else {
        toast.success('✅ Profile picture updated successfully! (Test mode - no real payment)');
      }
    }
  };

  const handleSetBio = async () => {
    if (!bioInput.trim()) {
      toast.error('Please enter a bio');
      return;
    }

    if (bioInput.trim().length > 150) {
      toast.error('Bio must be 150 characters or less');
      return;
    }

    // Format large numbers with spaces
    const formatTokenAmount = (amount: number) => {
      return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    // Check if this is first time (free) or requires payment
    const isFirstTime = !profile?.bio && !profile?.bio_unlock_status;
    
    let testTransactionSignature = '';
    
    if (!isFirstTime) {
      // TEST MODE: Simulate payment for bio changes after first time
      testTransactionSignature = `test_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Show payment simulation
      toast.success(`🎯 TEST PAYMENT SIMULATION 🎯`);
      toast.info(`Paying: ${formatTokenAmount(bioPricing.animeAmount)} $ANIME ≈ ${bioPricing.usdPrice.toFixed(2)} USDT`, {
        duration: 3000
      });
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      testTransactionSignature = `free_first_time_${Date.now()}`;
      toast.success('🎉 First bio is free!');
    }
    
    const success = await setBio(bioInput.trim(), testTransactionSignature);
    if (success) {
      setBioDialogOpen(false);
      setBioInput('');
      if (isFirstTime) {
        toast.success('✅ Bio set successfully! (First time free)');
      } else {
        toast.success('✅ Bio updated successfully! (Test mode - no real payment)');
      }
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground">
              To view and customize your profile, please connect your wallet using the 
              <span className="font-medium text-foreground"> "Connect Wallet" </span>
              button in the top-right corner.
            </p>
            <p className="text-xs text-muted-foreground bg-success/10 p-2 rounded border border-success/20">
              🔒 <span className="font-medium text-success">Safe Connection:</span> Connecting your wallet is completely secure and won't allow any charges without your explicit approval.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rankBadge = getRankBadge(profile.profile_rank);
  const rankColor = getRankColor(profile.profile_rank);

  // Format large numbers with spaces  
  const formatTokenAmount = (amount: number) => {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <Avatar onClick={handleAvatarClick} title="Change profile picture" className="w-24 h-24 cursor-pointer ring-2 ring-transparent hover:ring-primary transition">
            <AvatarImage 
              src={profile.profile_image_url} 
              alt={profile.nickname || 'Profile'} 
            />
            <AvatarFallback className="text-lg">
              {profile.nickname 
                ? profile.nickname.slice(0, 2).toUpperCase() 
                : profile.wallet_address.slice(0, 2).toUpperCase()
              }
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-8 h-8 rounded-full border bg-background hover:bg-muted transition"
            aria-label="Change profile picture"
            title="Change profile picture"
          >
            <Image className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Info Section */}
        <div className="mb-4">
          <div className="mb-2">
            <h3 className="text-lg font-semibold">
              <span
                onClick={handleNicknameTitleClick}
                role="button"
                className="cursor-pointer hover:underline"
                title={profile.nickname ? 'Change nickname' : 'Set nickname'}
              >
                {profile.nickname || 'Set Nickname'}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {truncateAddress(profile.wallet_address)}
            </p>
          </div>
          
          {/* Profile Stats: Trades + Level */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-sm text-muted-foreground">{profile.trade_count} trades</span>
            <button
                onClick={() => profile?.user_id && toggleFollowByUserId(profile.user_id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border transition-all duration-200 hover:scale-105"
                aria-label={profile?.user_id && isFollowingUserId(profile.user_id) ? 'Unfollow creator' : 'Follow creator'}
                disabled={followLoading || !profile?.user_id}
              >
                {profile?.user_id && isFollowingUserId(profile.user_id) ? (
                  <UserCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-xs">{profile?.user_id && isFollowingUserId(profile.user_id) ? 'Following' : 'Follow'}</span>
              </button>
          </div>
        </div>
        
        {/* Bio Section */}
        {profile.bio ? (
          <p className="text-sm text-muted-foreground italic mb-4 line-clamp-2">
            {profile.bio}
          </p>
        ) : (
          <div className="text-center mb-4">
            <div 
              className="cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors inline-block"
              onClick={handleBioClick}
              title="Set bio (first time free!)"
            >
              <p className="text-sm text-muted-foreground italic">moje bio 100 characters</p>
            </div>
          </div>
        )}

        {/* Profile Like/Follow */}
        <div className="mb-4">
            <button
              aria-label={profile?.user_id && isFollowingUserId(profile.user_id) ? 'Unfollow' : 'Follow'}
              disabled={followLoading || !profile?.user_id}
              onClick={(e) => {
                e.stopPropagation();
                if (profile?.user_id) toggleFollowByUserId(profile.user_id);
              }}
              className="inline-flex items-center gap-2 justify-center px-4 py-2 rounded-md border hover:bg-muted transition-colors"
            >
              {profile?.user_id && isFollowingUserId(profile.user_id) ? (
                <>
                  <UserCheck className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Follow</span>
                </>
              )}
            </button>
          </div>
        
        {/* Content Stats */}
        <div className="flex items-center justify-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1">
            <span className="font-medium text-primary">{nftCount}</span>
            <span className="text-muted-foreground">NFTs</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-primary">{collectionCount}</span>
            <span className="text-muted-foreground">Collections</span>
          </div>
        </div>
         
        {/* Activity Stats */}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>{profile?.user_id ? getCreatorFollowerCount(profile.user_id) : 0} followers</span>
          <span>•</span>
          <span>{profile?.user_id ? getCreatorTotalLikeCount(profile.user_id) : 0} likes received</span>
        </div>

        <div className="space-y-2">
          {/* Nickname Setting */}
          <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
            <DialogContent>
                <DialogHeader>
                  <DialogTitle>{profile.nickname ? 'Change Your Nickname' : 'Set Your Nickname'}</DialogTitle>
                  <DialogDescription>Enter a nickname and confirm payment to save.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {!profile.nickname ? (
                    <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-success">First Nickname - FREE!</span>
                        <span className="text-2xl">🎉</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Your first nickname is completely free. Future changes will cost 1 USDT.
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Payment Required</span>
                        <DollarSign className="w-4 h-4 text-primary" />
                      </div>
                      {nicknamePricing.loading ? (
                        <div className="animate-pulse">Loading pricing...</div>
                      ) : (
                        <div>
                          <div className="text-lg font-bold">{formatTokenAmount(nicknamePricing.animeAmount)} $ANIME</div>
                          <div className="text-sm text-muted-foreground">
                            ≈ {nicknamePricing.usdPrice.toFixed(2)} USDT
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Price updated every 30 seconds
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <Separator />
                  <div>
                    <Label htmlFor="nickname">Nickname (3-15 characters, alphanumeric only)</Label>
                    <Input
                      id="nickname"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      placeholder="Enter your nickname"
                      maxLength={15}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {!profile.nickname ? 'First nickname is free!' : 'Each nickname change requires payment'}
                    </div>
                  </div>
                  <Button 
                    onClick={handleSetNickname} 
                    className="w-full"
                    disabled={loading || (!profile.nickname ? false : nicknamePricing.loading)}
                  >
                    {loading ? 'Processing...' : 
                     !profile.nickname ? 'Set Nickname (FREE)' : 
                     `Pay ${formatTokenAmount(nicknamePricing.animeAmount)} $ANIME`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

          {/* PFP Selection Dialog */}
          <Dialog open={pfpDialogOpen} onOpenChange={setPfpDialogOpen}>
            <DialogContent className="sm:max-w-[680px] h-[90vh] flex flex-col p-0">
              {/* Combined Header & Preview Section */}
              <div className="flex-shrink-0 p-6 border-b bg-gradient-to-r from-background to-muted/30">
                <div className="flex items-start gap-6">
                  {/* Large Preview */}
                  <div className="flex-shrink-0">
                    <h3 className="text-lg font-semibold mb-3">Choose Your Profile Picture</h3>
                    <div className="relative">
                      <Avatar className={`w-24 h-24 border-4 ${rankColor} shadow-lg`}>
                        <AvatarImage 
                          src={(selectedNftForPfp ? userNFTs.find(nft => nft.mint_address === selectedNftForPfp)?.image_url : profile.profile_image_url) || undefined}
                          alt="Preview"
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {profile.nickname?.slice(0, 2).toUpperCase() || profile.wallet_address.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {selectedNftForPfp && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Image className="w-3 h-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview Info */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <p className="font-semibold text-lg">{profile.nickname || truncateAddress(profile.wallet_address)}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedNftForPfp ? (userNFTs.find(nft => nft.mint_address === selectedNftForPfp)?.name || 'Selected NFT') : 'Current Profile Picture'}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Cost: {(!profile.pfp_unlock_status && !profile.profile_image_url) ? 'FREE for first time!' : `${formatTokenAmount(pfpPricing.animeAmount)} ANIME ($${pfpPricing.usdPrice})`}</p>
                      <p className="mt-1">Select an NFT from your collection below</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable NFT Grid */}
              <div className="flex-1 min-h-0 overflow-auto">
                <div className="p-4">
                  {userNFTs.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {userNFTs.map((nft) => (
                        <div
                          key={nft.mint_address}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                            selectedNftForPfp === nft.mint_address
                              ? "border-primary ring-1 ring-primary/30"
                              : "border-border hover:border-foreground/20"
                          }`}
                          onClick={() => handleNftClick(nft.mint_address)}
                          title={nft.name}
                        >
                          <div className="aspect-square">
                            <img
                              src={nft.image_url}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                            <p className="text-white text-[10px] font-medium truncate">{nft.name}</p>
                          </div>
                          {selectedNftForPfp === nft.mint_address && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Image className="w-3 h-3 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No NFTs found in your wallet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex-shrink-0 border-t p-6 bg-background">
                {selectedNftForPfp ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">
                        {(!profile.pfp_unlock_status && !profile.profile_image_url) ? 'FREE' : 
                         `${formatTokenAmount(pfpPricing.animeAmount)} ANIME ($${pfpPricing.usdPrice.toFixed(2)})`
                        }
                      </span>
                    </div>
                    <Button 
                      onClick={handleConfirmPFP}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Processing...' : 
                        (!profile.pfp_unlock_status && !profile.profile_image_url) ? 'Set Profile Picture (FREE)' : 
                        'Confirm & Pay'
                      }
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">
                    Select an NFT to continue
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>


          {/* Bio Setting Dialog */}
          <Dialog open={bioDialogOpen} onOpenChange={setBioDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {profile.bio ? 'Change Your Bio' : 'Set Your Bio'}
                </DialogTitle>
                <DialogDescription>Write your bio and confirm. First bio is free.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {!profile.bio && !profile.bio_unlock_status ? (
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-success">First Bio - FREE!</span>
                      <span className="text-2xl">🎉</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Your first bio is completely free. Future changes will cost 2 USDT.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Payment Required</span>
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    {bioPricing.loading ? (
                      <div className="animate-pulse">Loading pricing...</div>
                    ) : (
                      <div>
                        <div className="text-lg font-bold">{formatTokenAmount(bioPricing.animeAmount)} $ANIME</div>
                        <div className="text-sm text-muted-foreground">
                          ≈ {bioPricing.usdPrice.toFixed(2)} USDT
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Price updated every 30 seconds
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Separator />
                <div>
                  <Label htmlFor="bio">Bio (max 100 characters)</Label>
                  <textarea
                    id="bio"
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Tell everyone about yourself..."
                    maxLength={150}
                    className="w-full p-2 border border-border bg-background text-foreground rounded-md resize-none h-20 mt-1 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                    <span>Will be visible on marketplace</span>
                    <span>{bioInput.length}/150</span>
                  </div>
                </div>
                <Button 
                  onClick={handleSetBio} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 
                    (!profile.bio && !profile.bio_unlock_status) ? 'Set Bio (Free!)' : 
                    (bioPricing.loading ? 'Confirm' : `Pay ${formatTokenAmount(bioPricing.animeAmount)} $ANIME`)
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};