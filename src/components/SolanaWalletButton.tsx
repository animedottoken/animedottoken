import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Wallet, ExternalLink, Zap, Shuffle, LogOut, AlertTriangle, Eye } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { metaplexService } from '@/services/metaplexService';
import { toast } from 'sonner';

export const SolanaWalletButton = () => {
  const { 
    connected, 
    connecting, 
    publicKey, 
    balance, 
    walletName, 
    connect, 
    disconnect, 
    error,
    connectWith,
    listProviders,
    wallet,
    rememberWallet,
    setRememberWallet
  } = useSolanaWallet();
  const { cluster } = useEnvironment();
  const [requestingAirdrop, setRequestingAirdrop] = useState(false);
  const [providers, setProviders] = useState<{ installed: string[]; hasPreview: boolean }>({ 
    installed: [], 
    hasPreview: false 
  });

  // Set Metaplex cluster and wallet when environment or wallet changes
  useEffect(() => {
    metaplexService.setCluster(cluster);
    if (wallet) {
      metaplexService.setWallet(wallet);
    }
  }, [cluster, wallet]);

  useEffect(() => {
    const availableProviders = listProviders();
    setProviders(availableProviders);
  }, [listProviders]);

  const handleAirdrop = useCallback(async () => {
    if (!publicKey || cluster !== 'devnet') return;
    
    setRequestingAirdrop(true);
    try {
      const result = await metaplexService.requestAirdrop(publicKey);
      if (result.success) {
        toast.success('Airdrop successful! 🎉', {
          description: 'Received 1 SOL on Devnet'
        });
      } else {
        toast.error('Airdrop failed', {
          description: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      toast.error('Airdrop failed', {
        description: 'Please try again later'
      });
    } finally {
      setRequestingAirdrop(false);
    }
  }, [publicKey, cluster]);

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    }
  }, [connect]);

  const handleWalletConnect = useCallback(async (walletName: string) => {
    try {
      await connectWith(walletName);
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  }, [connectWith]);

  const connectPreviewWallet = useCallback(async () => {
    try {
      await connectWith('Unsafe');
    } catch (error) {
      console.error('Preview wallet error:', error);
    }
  }, [connectWith]);

  // Connected state
  if (connected && publicKey) {
    const truncatedKey = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
    const isPreviewWallet = walletName?.toLowerCase().includes('unsafe') || walletName?.toLowerCase().includes('burner');
    const isDevnet = cluster === 'devnet';
    
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Wallet className="h-4 w-4 text-primary" />
            <div>
              <div className="font-mono text-sm">{truncatedKey}</div>
              <div className="text-xs text-muted-foreground">
                {balance.toFixed(4)} SOL
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {walletName && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{walletName}</span>
                {isPreviewWallet && (
                  <>
                    <Badge variant="outline" className="text-xs">Preview</Badge>
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {isPreviewWallet && (
          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-700">
            <Eye className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Preview wallet active. Perfect for testing, but remember real wallets are needed for mainnet.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-wrap gap-2">
          {/* Only show airdrop on devnet */}
          {isDevnet && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAirdrop}
              disabled={requestingAirdrop}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {requestingAirdrop ? 'Getting SOL...' : 'Get SOL'}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            className="flex items-center gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Switch
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleConnect} disabled={connecting} className="w-full">
          Try Again
        </Button>
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="space-y-3">
      <Button 
        onClick={handleConnect} 
        disabled={connecting}
        className="w-full"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      {/* Remember wallet checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="remember-wallet" 
          checked={rememberWallet}
          onCheckedChange={setRememberWallet}
        />
        <label 
          htmlFor="remember-wallet" 
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Remember my wallet choice
        </label>
      </div>
      
      {/* Direct provider buttons for better iframe support */}
      {providers.installed.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground text-center">Or connect directly:</div>
          <div className="grid grid-cols-1 gap-2">
            {providers.installed.map((providerName) => (
              <Button
                key={providerName}
                variant="outline"
                size="sm"
                onClick={() => handleWalletConnect(providerName)}
                disabled={connecting}
                className="w-full justify-start"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {providerName}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Iframe detection and new tab option */}
      {typeof window !== 'undefined' && window !== window.parent && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-700">
          <ExternalLink className="h-4 w-4" />
          <AlertDescription className="text-xs">
            For best wallet experience, 
            <Button 
              variant="link" 
              size="sm" 
              className="px-1 h-auto text-blue-700 underline"
              onClick={() => window.open(window.location.href, '_blank')}
            >
              open in new tab
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};