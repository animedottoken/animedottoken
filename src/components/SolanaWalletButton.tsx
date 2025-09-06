import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Wallet, Shuffle, LogOut, AlertTriangle } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { metaplexService } from '@/services/metaplexService';

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
    wallet,
    rememberWallet,
    setRememberWallet
  } = useSolanaWallet();
  const { cluster } = useEnvironment();

  // Set Metaplex cluster and wallet when environment or wallet changes
  useEffect(() => {
    metaplexService.setCluster(cluster);
    if (wallet) {
      metaplexService.setWallet(wallet);
    }
  }, [cluster, wallet]);

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    }
  }, [connect]);

  // Connected state
  if (connected && publicKey) {
    const truncatedKey = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
    
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
          {walletName && (
            <span className="text-xs text-muted-foreground">{walletName}</span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
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
    </div>
  );
};