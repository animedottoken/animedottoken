import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LogIn, LogOut, ExternalLink, AlertTriangle, Coins, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { requestDevnetAirdrop } from '@/services/devnetHelpers';
import { toast } from 'sonner';

export const SolanaWalletButton = () => {
  const { connected, connecting, publicKey, balance, walletName, connectWith, disconnect, connect, openWalletSelector, listProviders, error } = useSolanaWallet();
  const [providers, setProviders] = useState<string[]>([]);
  const [requestingAirdrop, setRequestingAirdrop] = useState(false);
  
  const isPreviewWallet = walletName && /unsafe|burner/i.test(walletName);

  const handleAirdrop = async () => {
    if (!publicKey) return;
    
    setRequestingAirdrop(true);
    try {
      const result = await requestDevnetAirdrop(publicKey);
      if (result.success) {
        toast.success('Airdrop successful! 💰', {
          description: '2 SOL added to your wallet',
        });
      } else {
        toast.error('Airdrop failed', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('Airdrop failed', {
        description: 'Please try again later',
      });
    } finally {
      setRequestingAirdrop(false);
    }
  };

  useEffect(() => {
    setProviders(listProviders());
  }, [listProviders]);

  if (connected && publicKey) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
            </div>
            <div className="text-sm font-medium">
              {balance.toFixed(3)} SOL
            </div>
          </div>
          {walletName && (
            <div className="flex items-center gap-1">
              <Badge variant={isPreviewWallet ? "outline" : "secondary"} className="text-xs">
                {isPreviewWallet && <Zap className="w-3 h-3 mr-1" />}
                {isPreviewWallet ? "Preview" : walletName}
              </Badge>
              {isPreviewWallet && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Preview Wallet - For testing only<br />Switch to a real wallet for production</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
          <Button 
            onClick={handleAirdrop}
            disabled={requestingAirdrop || balance >= 5}
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 text-xs"
          >
            {requestingAirdrop ? '...' : <Coins className="w-3 h-3" />}
            Get SOL
          </Button>
          <Button onClick={openWalletSelector} variant="ghost" size="sm">
            Switch
          </Button>
          <Button onClick={disconnect} variant="outline" size="sm" className="flex items-center gap-2">
            Disconnect
            <LogOut className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TooltipProvider>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={openWalletSelector} variant="outline" className="w-full">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Connect Buttons */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground text-center">Quick Connect</div>
        <div className="grid grid-cols-2 gap-2">
          {providers.includes('Phantom') && (
            <Button
              onClick={() => connectWith('Phantom')}
              disabled={connecting}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {connecting ? '...' : 'Phantom'}
            </Button>
          )}
          {providers.includes('Solflare') && (
            <Button
              onClick={() => connectWith('Solflare')}
              disabled={connecting}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {connecting ? '...' : 'Solflare'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Connect Button */}
      <Button 
        onClick={connect}
        disabled={connecting}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
      >
        {connecting ? (
          'Connecting...'
        ) : (
          <>
            Connect Wallet
            <LogIn className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
};