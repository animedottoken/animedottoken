import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Coins, TrendingUp, Shield, Clock, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useToast } from '@/hooks/use-toast';
import { ANIME_MINT_ADDRESS } from '@/constants/token';
import { useAnimeStaking } from '@/hooks/useAnimeStaking';
import AuthModal from '@/components/AuthModal';

const Staking = () => {
  const { user } = useAuth();
  const { publicKey, connected, connectPaymentWallet } = useSolanaWallet();
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const {
    userStakes,
    totalStaked,
    animeBalance,
    pendingRewards,
    isLoading,
    refetch,
    stakeTokens,
    unstakeTokens,
    claimRewards
  } = useAnimeStaking();

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid staking amount",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(stakeAmount) > (animeBalance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough $ANIME tokens",
        variant: "destructive"
      });
      return;
    }

    try {
      await stakeTokens(parseFloat(stakeAmount));
      setStakeAmount('');
      toast({
        title: "Staking Successful",
        description: `Successfully staked ${stakeAmount} $ANIME tokens`,
      });
    } catch (error: any) {
      toast({
        title: "Staking Failed",
        description: error.message || "Failed to stake tokens",
        variant: "destructive"
      });
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid unstaking amount",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(unstakeAmount) > (totalStaked || 0)) {
      toast({
        title: "Insufficient Staked Amount",
        description: "You don't have enough staked tokens",
        variant: "destructive"
      });
      return;
    }

    try {
      await unstakeTokens(parseFloat(unstakeAmount));
      setUnstakeAmount('');
      toast({
        title: "Unstaking Successful",
        description: `Successfully unstaked ${unstakeAmount} $ANIME tokens`,
      });
    } catch (error: any) {
      toast({
        title: "Unstaking Failed",
        description: error.message || "Failed to unstake tokens",
        variant: "destructive"
      });
    }
  };

  const handleClaimRewards = async () => {
    if (!pendingRewards || pendingRewards <= 0) {
      toast({
        title: "No Rewards",
        description: "You have no pending rewards to claim",
        variant: "destructive"
      });
      return;
    }

    try {
      await claimRewards();
      toast({
        title: "Rewards Claimed",
        description: `Successfully claimed ${pendingRewards.toFixed(4)} $ANIME tokens`,
      });
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim rewards",
        variant: "destructive"
      });
    }
  };

  const canAccessVault = (totalStaked || 0) >= 1000;

  // Show welcome screen when not authenticated or connected
  if (!user || !connected) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-background to-muted p-4 pt-8">
        <Helmet>
          <title>$ANIME Staking - A New Internet Money Era</title>
          <meta name="description" content="Stake $ANIME tokens to earn rewards and gain access to the exclusive Volatility Vault trading system. Welcome to the new Internet Money era." />
        </Helmet>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-2">Welcome to</CardTitle>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold">$ANIME Staking</span>
            </div>
            <CardDescription className="space-y-2">
              <div>Earn rewards and unlock exclusive perks by staking your $ANIME tokens!</div>
              <div className="text-sm font-medium text-primary">A New Internet Money Era</div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-3">
              {!user && (
                <Button onClick={() => setShowAuthModal(true)} className="w-full" size="lg">
                  <span className="mr-2">✨</span>
                  Sign In to Start Staking
                </Button>
              )}
              {!connected && user && (
                <Button variant="outline" onClick={() => connectPaymentWallet()} className="w-full" size="lg">
                  <span className="mr-2">🔗</span>
                  Connect Wallet
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Safe & secure connection 🔒
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Auth Modal */}
        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          title="Welcome to $ANIME Staking"
          description="Sign in to start staking your $ANIME tokens and earning rewards! 🚀"
          onSuccess={() => {
            setShowAuthModal(false);
            toast({
              title: "Welcome! 🎉",
              description: "You're now signed in. Connect your wallet to start staking!",
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Helmet>
        <title>$ANIME Staking - A New Internet Money Era</title>
        <meta name="description" content="Stake $ANIME tokens to earn rewards and gain access to the exclusive Volatility Vault trading system. Welcome to the new Internet Money era." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Coins className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              $ANIME Staking
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            Earn rewards and unlock exclusive perks by staking your $ANIME tokens! 🚀
          </p>
          <p className="text-sm font-medium text-primary">A New Internet Money Era</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Coins className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">$ANIME Balance</p>
                  <p className="text-2xl font-bold">{animeBalance?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Staked</p>
                  <p className="text-2xl font-bold">{totalStaked?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Rewards</p>
                  <p className="text-2xl font-bold">{pendingRewards?.toFixed(4) || '0.0000'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <Shield className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vault Access</p>
                  <Badge variant={canAccessVault ? "default" : "secondary"} className="text-sm">
                    {canAccessVault ? "Granted" : "Locked"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vault Access Status */}
        <Card className={`mb-8 ${canAccessVault ? 'border-green-500/20 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${canAccessVault ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <Shield className={`h-6 w-6 ${canAccessVault ? 'text-green-500' : 'text-yellow-500'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  Volatility Vault Access
                </h3>
                <p className="text-muted-foreground">
                  {canAccessVault 
                    ? "🎉 Awesome! You now have access to the Volatility Vault. Start earning from market volatility!"
                    : `You're ${(1000 - (totalStaked || 0)).toLocaleString()} $ANIME tokens away from unlocking the Volatility Vault! 💪`
                  }
                </p>
              </div>
              {canAccessVault && (
                <Button onClick={() => window.location.href = '/vault'}>
                  Access Vault
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Staking Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Stake Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Stake $ANIME
              </CardTitle>
              <CardDescription>
                Start earning rewards and unlock exclusive features! 💰
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stake-amount">Amount to Stake</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  min="0"
                  max={animeBalance || 0}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {animeBalance?.toLocaleString() || '0'} $ANIME
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStakeAmount(((animeBalance || 0) * 0.25).toString())}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStakeAmount(((animeBalance || 0) * 0.5).toString())}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStakeAmount(((animeBalance || 0) * 0.75).toString())}
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStakeAmount((animeBalance || 0).toString())}
                >
                  Max
                </Button>
              </div>
              <Button 
                onClick={handleStake} 
                disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                className="w-full"
              >
                {isLoading ? 'Staking...' : 'Stake Tokens'}
              </Button>
            </CardContent>
          </Card>

          {/* Unstake Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-blue-500" />
                Unstake $ANIME
              </CardTitle>
              <CardDescription>
                Withdraw your tokens or collect your earned rewards! 🎁
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="unstake-amount">Amount to Unstake</Label>
                <Input
                  id="unstake-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  min="0"
                  max={totalStaked || 0}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Staked: {totalStaked?.toLocaleString() || '0'} $ANIME
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnstakeAmount(((totalStaked || 0) * 0.25).toString())}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnstakeAmount(((totalStaked || 0) * 0.5).toString())}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnstakeAmount(((totalStaked || 0) * 0.75).toString())}
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnstakeAmount((totalStaked || 0).toString())}
                >
                  Max
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleUnstake} 
                  disabled={isLoading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? 'Unstaking...' : 'Unstake'}
                </Button>
                <Button 
                  onClick={handleClaimRewards} 
                  disabled={isLoading || !pendingRewards || pendingRewards <= 0}
                  className="flex-1"
                >
                  Claim Rewards
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Card>
          <CardHeader>
            <CardTitle>Staking Benefits</CardTitle>
            <CardDescription>
              Discover the amazing benefits of staking! ✨
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-3 rounded-full bg-green-500/10 w-fit mx-auto mb-3">
                  <Award className="h-6 w-6 text-green-500" />
                </div>
                <h4 className="font-semibold mb-2">💰 Earn Rewards</h4>
                <p className="text-sm text-muted-foreground">
                  Enjoy daily rewards on your staked $ANIME tokens with competitive returns!
                </p>
              </div>
              <div className="text-center">
                <div className="p-3 rounded-full bg-purple-500/10 w-fit mx-auto mb-3">
                  <Shield className="h-6 w-6 text-purple-500" />
                </div>
                <h4 className="font-semibold mb-2">🔓 Vault Access</h4>
                <p className="text-sm text-muted-foreground">
                  Stake 1,000+ $ANIME to unlock exclusive access to our premium Volatility Vault!
                </p>
              </div>
              <div className="text-center">
                <div className="p-3 rounded-full bg-blue-500/10 w-fit mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <h4 className="font-semibold mb-2">🗳️ Governance Rights</h4>
                <p className="text-sm text-muted-foreground">
                  Have your say in important decisions about vault parameters and strategy!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Welcome to $ANIME Staking"
        description="Sign in to start staking your $ANIME tokens and earning rewards! 🚀"
        onSuccess={() => {
          setShowAuthModal(false);
          toast({
            title: "Welcome! 🎉",
            description: "You're now signed in. Connect your wallet to start staking!",
          });
        }}
      />
    </div>
  );
};

export default Staking;