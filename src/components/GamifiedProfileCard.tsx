import { useState } from 'react';
import { Edit, Crown, Lock, Image, DollarSign, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGamifiedProfile } from '@/hooks/useGamifiedProfile';
import { useAnimePricing } from '@/hooks/useAnimePricing';
import { toast } from 'sonner';

export const GamifiedProfileCard = () => {
  const {
    profile,
    userNFTs,
    loading,
    nicknameLoading,
    pfpLoading,
    bioLoading,
    setNickname,
    unlockPFP,
    setPFP,
    setBio,
    getRankColor,
    getRankBadge,
  } = useGamifiedProfile();

  const nicknamePricing = useAnimePricing(1.00); // $1.00 USD for nickname
  const pfpPricing = useAnimePricing(2.00); // $2.00 USD for PFP unlock
  const bioPricing = useAnimePricing(2.00); // $2.00 USD for bio changes after first time

  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [pfpDialogOpen, setPfpDialogOpen] = useState(false);
  const [pfpConfirmDialogOpen, setPfpConfirmDialogOpen] = useState(false);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);
  const [selectedNftForPfp, setSelectedNftForPfp] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [bioInput, setBioInput] = useState('');

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

    // Format large numbers with spaces
    const formatTokenAmount = (amount: number) => {
      return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    // TEST MODE: Simulate payment without real transaction
    const testTransactionSignature = `test_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Show payment simulation
    toast.success(`🎯 TEST PAYMENT SIMULATION 🎯`);
    toast.info(`Paying: ${formatTokenAmount(nicknamePricing.animeAmount)} $ANIME ≈ ${nicknamePricing.usdPrice.toFixed(2)} USDT`, {
      duration: 3000
    });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = await setNickname(nicknameInput.trim(), testTransactionSignature);
    if (success) {
      setNicknameDialogOpen(false);
      setNicknameInput('');
      toast.success('✅ Nickname set successfully! (Test mode - no real payment)');
    }
  };

  const handleNftClick = (nftMintAddress: string) => {
    setSelectedNftForPfp(nftMintAddress);
    setPfpConfirmDialogOpen(true);
  };

  const handleConfirmPFP = async () => {
    if (!selectedNftForPfp) return;
    
    // Format large numbers with spaces
    const formatTokenAmount = (amount: number) => {
      return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    // TEST MODE: Simulate payment without real transaction
    const testTransactionSignature = `test_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Show payment simulation
    toast.success(`🎯 TEST PAYMENT SIMULATION 🎯`);
    toast.info(`Paying: ${formatTokenAmount(pfpPricing.animeAmount)} $ANIME ≈ ${pfpPricing.usdPrice.toFixed(2)} USDT`, {
      duration: 3000
    });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = await setPFP(selectedNftForPfp, testTransactionSignature);
    if (success) {
      setPfpDialogOpen(false);
      setPfpConfirmDialogOpen(false);
      setSelectedNftForPfp(null);
      toast.success('✅ Profile picture updated successfully! (Test mode - no real payment)');
    }
  };

  const handleSetBio = async () => {
    if (!bioInput.trim()) {
      toast.error('Please enter a bio');
      return;
    }

    if (bioInput.trim().length > 100) {
      toast.error('Bio must be 100 characters or less');
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
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Connect your wallet to view your profile</p>
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
      <CardHeader className="text-center pb-4">
        <div className="relative mx-auto cursor-pointer" onClick={handleAvatarClick} role="button" aria-label="Change profile picture" title="Change Profile Picture">
          <Avatar className={`w-40 h-40 border-4 ${rankColor} shadow-lg`}>
            <AvatarImage 
              src={profile.profile_image_url} 
              alt={profile.nickname || 'Profile'} 
            />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {profile.nickname 
                ? profile.nickname.slice(0, 2).toUpperCase() 
                : profile.wallet_address.slice(0, 2).toUpperCase()
              }
            </AvatarFallback>
          </Avatar>
          <Badge className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 ${rankBadge.color} text-white text-xs cursor-help z-10`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Crown className="w-3 h-3 mr-1" />
                    {rankBadge.text}
                    <Info className="w-3 h-3 ml-1" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs z-50">
                  <div className="space-y-2 text-sm">
                    <div className="font-semibold">Ranking System:</div>
                    <div>🏆 <strong>Diamond</strong>: 1,000+ trades</div>
                    <div>🥇 <strong>Gold</strong>: 250+ trades</div>
                    <div>🥈 <strong>Silver</strong>: 50+ trades</div>
                    <div>🥉 <strong>Bronze</strong>: 10+ trades</div>
                    <div>🎖️ <strong>Rookie</strong>: 0-9 trades</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Trade more NFTs to increase your rank!
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Badge>
          <div className="absolute bottom-0 right-0 translate-x-2 translate-y-2 bg-primary/20 text-primary border border-primary/30 rounded-full p-1">
            <Edit className="w-3 h-3" />
          </div>
        </div>
        <CardTitle className="mt-6 text-lg flex flex-col items-center justify-center gap-1">
          <span
            onClick={handleNicknameTitleClick}
            role="button"
            className="cursor-pointer hover:underline flex items-center gap-2"
            title={profile.nickname ? 'Change nickname' : 'Set nickname'}
          >
            {profile.nickname || 'Set Nickname'}
            <Edit className="w-4 h-4 text-muted-foreground" />
          </span>
          <span className="text-sm text-muted-foreground font-normal">
            {profile.wallet_address.slice(0, 4)}...{profile.wallet_address.slice(-4)}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bio Section */}
        <div className="text-center">
          <div 
            className="cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
            onClick={handleBioClick}
            title={profile.bio ? 'Change bio' : 'Set bio (first time free!)'}
          >
            {profile.bio ? (
              <p className="text-sm text-muted-foreground italic">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <span>Add bio (first time free!)</span>
                <Edit className="w-3 h-3" />
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{profile.trade_count}</div>
            <div className="text-sm text-muted-foreground">Trades</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{profile.trade_count >= 1000 ? 'Diamond' : profile.trade_count >= 250 ? 'Gold' : profile.trade_count >= 50 ? 'Silver' : profile.trade_count >= 10 ? 'Bronze' : 'Rookie'}</div>
            <div className="text-sm text-muted-foreground">Rank</div>
          </div>
        </div>

        <div className="space-y-2">
          {/* Nickname Setting */}
          <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{profile.nickname ? 'Change Your Nickname' : 'Set Your Nickname'}</DialogTitle>
              </DialogHeader>
                <div className="space-y-4">
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
                      Each nickname change requires payment
                    </div>
                  </div>
                  <Button 
                    onClick={handleSetNickname} 
                    className="w-full"
                    disabled={nicknameLoading || nicknamePricing.loading}
                  >
                    {nicknameLoading ? 'Processing Payment...' : `Pay ${formatTokenAmount(nicknamePricing.animeAmount)} $ANIME`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

          {/* PFP Selection Dialog */}
          <Dialog open={pfpDialogOpen} onOpenChange={setPfpDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Choose Your Profile Picture</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Payment Required</span>
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  {pfpPricing.loading ? (
                    <div className="animate-pulse">Loading pricing...</div>
                  ) : (
                    <div>
                      <div className="text-lg font-bold">{formatTokenAmount(pfpPricing.animeAmount)} $ANIME</div>
                      <div className="text-sm text-muted-foreground">
                        ≈ {pfpPricing.usdPrice.toFixed(2)} USDT
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Price updated every 30 seconds • Each PFP change requires payment
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {userNFTs
                    .filter((nft) => {
                      // Only show NFTs with 1:1 aspect ratio or close to it
                      // We'll assume most NFTs should be square for profile pictures
                      return true; // For now, show all NFTs but they'll be displayed in square containers
                    })
                    .map((nft) => (
                      <div
                        key={nft.mint_address}
                        className="cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-2 transition-colors"
                        onClick={() => handleNftClick(nft.mint_address)}
                      >
                        <div className="aspect-square mb-2">
                          {nft.image_url ? (
                            <img
                              src={nft.image_url}
                              alt={nft.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                              <Image className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium truncate">{nft.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{nft.symbol}</p>
                      </div>
                    ))}
                  {userNFTs.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-muted-foreground">
                      <Image className="w-12 h-12 mx-auto mb-2" />
                      <p>No NFTs found in your wallet</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* PFP Confirmation Dialog */}
          <Dialog open={pfpConfirmDialogOpen} onOpenChange={setPfpConfirmDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Profile Picture Change</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Payment Required</span>
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  {pfpPricing.loading ? (
                    <div className="animate-pulse">Loading pricing...</div>
                  ) : (
                    <div>
                      <div className="text-lg font-bold">{formatTokenAmount(pfpPricing.animeAmount)} $ANIME</div>
                      <div className="text-sm text-muted-foreground">
                        ≈ {pfpPricing.usdPrice.toFixed(2)} USDT
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        This will be charged immediately
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to change your profile picture? This action will charge your wallet.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPfpConfirmDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleConfirmPFP}
                    disabled={pfpLoading || pfpPricing.loading}
                  >
                    {pfpLoading ? 'Processing...' : 'Confirm & Pay'}
                  </Button>
                </div>
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
              </DialogHeader>
              <div className="space-y-4">
                {!profile.bio && !profile.bio_unlock_status ? (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800 dark:text-green-200">First Bio - FREE!</span>
                      <span className="text-2xl">🎉</span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
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
                    maxLength={100}
                    className="w-full p-2 border border-border bg-background text-foreground rounded-md resize-none h-20 mt-1 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                    <span>Will be visible on marketplace</span>
                    <span>{bioInput.length}/100</span>
                  </div>
                </div>
                <Button 
                  onClick={handleSetBio} 
                  className="w-full"
                  disabled={bioLoading || (profile.bio || profile.bio_unlock_status ? bioPricing.loading : false)}
                >
                  {bioLoading ? 'Processing...' : 
                    (!profile.bio && !profile.bio_unlock_status) ? 'Set Bio (Free!)' : 
                    `Pay ${formatTokenAmount(bioPricing.animeAmount)} $ANIME`
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