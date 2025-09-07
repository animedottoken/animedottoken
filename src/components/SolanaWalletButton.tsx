import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Wallet, Shuffle, LogOut, AlertTriangle, ExternalLink } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { metaplexService } from '@/services/metaplexService';
import { BrandedWalletModal } from './BrandedWalletModal';

export const SolanaWalletButton = () => {
  const { 
    connected, 
    connecting, 
    publicKey, 
    balance, 
    walletName, 
    walletIcon,
    connect, 
    disconnect, 
    error,
    wallet,
    rememberWallet,
    setRememberWallet
  } = useSolanaWallet();
  const { cluster } = useEnvironment();
  const [showBrandedModal, setShowBrandedModal] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  // Set Metaplex cluster and wallet when environment or wallet changes
  useEffect(() => {
    metaplexService.setCluster(cluster);
    if (wallet) {
      metaplexService.setWallet(wallet);
    }
  }, [cluster, wallet]);

  // Detect iframe context
  useEffect(() => {
    setIsInIframe(typeof window !== 'undefined' && window !== window.parent);
  }, []);

  const handleConnect = useCallback(async () => {
    // Use our custom branded modal instead of default
    setShowBrandedModal(true);
  }, []);

  const openInNewTab = useCallback(() => {
    window.open(window.location.href, '_blank');
  }, []);

  // Connected state
  if (connected && publicKey) {
    const truncatedKey = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
    
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {walletIcon ? (
              <img src={walletIcon} alt={walletName || 'Wallet'} className="h-5 w-5" />
            ) : (
              <Wallet className="h-4 w-4 text-primary" />
            )}
            <div>
              <div className="font-mono text-sm">{truncatedKey}</div>
              <div className="text-xs text-muted-foreground">
                {balance.toFixed(4)} SOL • {cluster}
              </div>
            </div>
          </div>
          {walletName && (
            <span className="text-xs text-muted-foreground font-medium">{walletName}</span>
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
      {/* Iframe warning for better UX */}
      {isInIframe && (
        <div className="p-3 border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Best wallet experience</p>
              <p className="text-xs">Open in new tab for optimal connection</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInNewTab}
              className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
      )}
      
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

      {/* Custom branded wallet modal */}
      <BrandedWalletModal 
        open={showBrandedModal}
        onOpenChange={setShowBrandedModal}
      />
    </div>
  );
};