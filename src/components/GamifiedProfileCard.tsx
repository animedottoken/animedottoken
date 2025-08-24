import { useState } from 'react';
import { Edit, Crown, Lock, Unlock, Image, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
    if (profile.pfp_unlock_status) {
      setPfpDialogOpen(true);
    } else {
      setPfpUnlockDialogOpen(true);
    }
  };

  const handleNicknameTitleClick = () => {
    if (!profile) return;
    if (!profile.nickname) {
      setNicknameDialogOpen(true);
    } else {
      toast.error('Nickname can only be set once.');
    }
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

    // In a real implementation, this would trigger a Solana transaction
    const fakeSignature = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    toast.info(`Processing payment: ${formatTokenAmount(nicknamePricing.animeAmount)} $ANIME (≈$${nicknamePricing.usdPrice.toFixed(2)} USDT)`);
    
    const success = await setNickname(nicknameInput.trim(), fakeSignature);
    if (success) {
      setNicknameDialogOpen(false);
      setNicknameInput('');
    }
  };

  const handleUnlockPFP = async () => {
    // Format large numbers with spaces
    const formatTokenAmount = (amount: number) => {
      return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    // In a real implementation, this would trigger a Solana transaction
    const fakeSignature = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    toast.info(`Processing payment: ${formatTokenAmount(pfpPricing.animeAmount)} $ANIME (≈$${pfpPricing.usdPrice.toFixed(2)} USDT)`);
    
    const success = await unlockPFP(fakeSignature);
    if (success) {
      setPfpUnlockDialogOpen(false);
      setPfpDialogOpen(true);
    }
  };

  const handleSetPFP = async (nftMintAddress: string) => {
    const success = await setPFP(nftMintAddress);
    if (success) {
      setPfpDialogOpen(false);
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
        <div className="relative mx-auto cursor-pointer" onClick={handleAvatarClick} role="button" aria-label="Change profile picture" title={profile.pfp_unlock_status ? 'Change PFP' : 'Unlock Custom PFP'}>
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
          <Badge className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${rankBadge.color} text-white text-xs`}>
            <Crown className="w-3 h-3 mr-1" />
            {rankBadge.text}
          </Badge>
          {profile.pfp_unlock_status ? (
            <div className="absolute bottom-0 right-0 translate-x-2 translate-y-2 bg-primary/20 text-primary border border-primary/30 rounded-full p-1">
              <Edit className="w-3 h-3" />
            </div>
          ) : (
            <div className="absolute bottom-0 right-0 translate-x-2 translate-y-2 bg-muted text-muted-foreground border border-border rounded-full p-1">
              <Lock className="w-3 h-3" />
            </div>
          )}
        </div>
        <CardTitle className="mt-4 text-lg flex items-center justify-center gap-2">
          <span
            onClick={handleNicknameTitleClick}
            role="button"
            className={!profile.nickname ? 'cursor-pointer hover:underline' : 'cursor-pointer'}
            title={!profile.nickname ? 'Set nickname' : 'Nickname can be set only once'}
          >
            {profile.nickname || `${profile.wallet_address.slice(0, 4)}...${profile.wallet_address.slice(-4)}`}
          </span>
          {!profile.nickname && <Edit className="w-4 h-4 text-muted-foreground" />}
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
                          ≈ ${nicknamePricing.usdPrice.toFixed(2)} USDT
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
                      Note: You can only set your nickname once
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

          {/* PFP Feature */}
          {!profile.pfp_unlock_status ? (
            <Dialog open={pfpUnlockDialogOpen} onOpenChange={setPfpUnlockDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Unlock Custom Profile Picture</DialogTitle>
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
                          ≈ ${pfpPricing.usdPrice.toFixed(2)} USDT
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Price updated every 30 seconds
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    <p>Unlock the ability to set any NFT from your wallet as your profile picture. This is a one-time unlock that gives you permanent access to the custom PFP feature.</p>
                  </div>
                  <Button 
                    onClick={handleUnlockPFP} 
                    className="w-full"
                    disabled={pfpLoading || pfpPricing.loading}
                  >
                    {pfpLoading ? 'Processing Payment...' : `Pay ${formatTokenAmount(pfpPricing.animeAmount)} $ANIME`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={pfpDialogOpen} onOpenChange={setPfpDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full text-green-600 border-green-600 hover:bg-green-50">
                  <Unlock className="w-4 h-4 mr-2" />
                  Change PFP
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Choose Your Profile Picture</DialogTitle>
                </DialogHeader>
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
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};