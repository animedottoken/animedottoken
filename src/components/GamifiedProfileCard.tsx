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
    setNickname,
    unlockPFP,
    setPFP,
    getRankColor,
    getRankBadge,
  } = useGamifiedProfile();

  const nicknamePricing = useAnimePricing(1.00); // $1.00 USD for nickname
  const pfpPricing = useAnimePricing(2.00); // $2.00 USD for PFP unlock

  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [pfpDialogOpen, setPfpDialogOpen] = useState(false);
  const [pfpUnlockDialogOpen, setPfpUnlockDialogOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  const handleAvatarClick = () => {
    if (!profile) return;
    setPfpDialogOpen(true);
  };

  const handleNicknameTitleClick = () => {
    if (!profile) return;
    setNicknameInput(profile.nickname || '');
    setNicknameDialogOpen(true);
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

  const handleSetPFP = async (nftMintAddress: string) => {
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
    
    const success = await setPFP(nftMintAddress, testTransactionSignature);
    if (success) {
      setPfpDialogOpen(false);
      toast.success('✅ Profile picture updated successfully! (Test mode - no real payment)');
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
          <Avatar className={`w-20 h-20 border-4 ${rankColor} shadow-lg`}>
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
          <Badge className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${rankBadge.color} text-white text-xs cursor-help`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Crown className="w-3 h-3 mr-1" />
                    {rankBadge.text}
                    <Info className="w-3 h-3 ml-1" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
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
        <CardTitle className="mt-4 text-lg flex flex-col items-center justify-center gap-1">
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
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{profile.trade_count}</div>
            <div className="text-sm text-muted-foreground">Trades</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{profile.profile_rank}</div>
            <div className="text-sm text-muted-foreground">Rank</div>
          </div>
        </div>

        <div className="space-y-2">
          {/* Nickname Setting */}
          {!profile.nickname && (
            <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Your Nickname</DialogTitle>
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
          )}

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
                  {userNFTs.map((nft) => (
                    <div
                      key={nft.mint_address}
                      className="cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-2 transition-colors"
                      onClick={() => handleSetPFP(nft.mint_address)}
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
        </div>
      </CardContent>
    </Card>
  );
};