import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ExternalLink, AlertTriangle, Smartphone } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEnvironment } from '@/contexts/EnvironmentContext';
interface BrandedWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BrandedWalletModal = ({ open, onOpenChange }: BrandedWalletModalProps) => {
  const { listProviders, connectWith, connecting } = useSolanaWallet();
  const { cluster } = useEnvironment();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  // Detect if running in iframe
  useEffect(() => {
    setIsInIframe(typeof window !== 'undefined' && window !== window.parent);
  }, []);

  const { wallets: adapterWallets } = useWallet();
  const iconMap = useMemo(() => {
    const map: Record<string, string> = {};
    adapterWallets.forEach((w) => {
      const name = w?.adapter?.name?.toLowerCase?.();
      const icon = (w?.adapter as any)?.icon as string | undefined;
      if (name && icon) map[name] = icon;
    });
    return map;
  }, [adapterWallets]);

  const providers = listProviders();

// Define wallet metadata with proper branding
  const walletMeta = [
    {
      name: 'Phantom',
      description: 'A friendly Solana wallet built for DeFi & NFTs',
      downloadUrl: 'https://phantom.app/',
      mobileSupported: true
    },
    {
      name: 'Solflare',
      description: 'The Solana wallet you can trust',
      downloadUrl: 'https://solflare.com/',
      mobileSupported: true
    }
  ];

  const handleWalletSelect = async (walletName: string) => {
    setSelectedWallet(walletName);
    
    // Check if wallet is installed
    const isInstalled = providers.installed.some(name => 
      name.toLowerCase().includes(walletName.toLowerCase())
    );
    
    // Handle mobile deep-linking if wallet not installed
    if (!isInstalled && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      const wallet = walletMeta.find(w => 
        w.name.toLowerCase() === walletName.toLowerCase()
      );
      
      if (wallet?.mobileSupported) {
        const currentUrl = encodeURIComponent(window.location.href);
        let deepLink = '';
        
        if (walletName.toLowerCase() === 'phantom') {
          deepLink = `https://phantom.app/ul/v1/connect?app_url=${currentUrl}&cluster=${cluster}`;
        } else if (walletName.toLowerCase() === 'solflare') {
          deepLink = `https://solflare.com/ul/v1/connect?app_url=${currentUrl}`;
        }
        
        if (deepLink) {
          window.location.href = deepLink;
          return;
        }
      }
    }
    
    // Show install prompt for desktop if not installed
    if (!isInstalled) {
      const wallet = walletMeta.find(w => 
        w.name.toLowerCase() === walletName.toLowerCase()
      );
      
      if (wallet) {
        toast.info(`${wallet.name} not detected`, {
          description: "Install the wallet extension and refresh the page",
          action: {
            label: 'Download',
            onClick: () => window.open(wallet.downloadUrl, '_blank')
          }
        });
      }
      return;
    }

    // Handle iframe - immediately open new tab with wallet parameter
    if (isInIframe) {
      const newTabUrl = `${window.location.origin}${window.location.pathname}?connectWallet=${walletName.toLowerCase()}${window.location.hash}`;
      window.open(newTabUrl, '_blank', 'noopener,noreferrer');
      onOpenChange(false);
      return;
    }

    // Direct connection for top-level windows
    try {
      await connectWith(walletName);
      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to connect to ${walletName}:`, error);
      toast.error(`Failed to connect to ${walletName}`);
    } finally {
      setSelectedWallet(null);
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-primary/80">
              <img 
                src="/lovable-uploads/e49a91e3-5dc5-4a4e-86d9-c1885a91ab07.png" 
                alt="ANIME.TOKEN" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Connect Wallet</DialogTitle>
              <p className="text-sm text-muted-foreground">Choose how you'd like to connect</p>
            </div>
          </div>
        </DialogHeader>

        {/* Iframe Warning */}
        {isInIframe && (
          <Card className="p-3 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  For the best wallet experience, open in a new tab
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openInNewTab}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open New Tab
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {walletMeta.map((wallet) => {
            const isInstalled = providers.installed.some(name => 
              name.toLowerCase().includes(wallet.name.toLowerCase())
            );
            const isConnecting = connecting && selectedWallet === wallet.name;

            return (
              <Card 
                key={wallet.name}
                className={`p-4 cursor-pointer transition-all hover:bg-muted/50 ${
                  isInstalled ? 'border-green-200 dark:border-green-800' : 'border-border'
                } ${isConnecting ? 'animate-pulse' : ''}`}
                onClick={() => !isConnecting && handleWalletSelect(wallet.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {iconMap[wallet.name.toLowerCase()] ? (
                        <img
                          src={iconMap[wallet.name.toLowerCase()]}
                          alt={wallet.name}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <span className="text-lg">{wallet.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{wallet.name}</h4>
                        {isInstalled && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Ready
                          </Badge>
                        )}
                        {wallet.mobileSupported && (
                          <Smartphone className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {wallet.description}
                      </p>
                    </div>
                  </div>
                  
                  {!isInstalled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(wallet.downloadUrl, '_blank');
                      }}
                      className="text-xs h-7"
                    >
                      Install
                    </Button>
                  )}
                  
                  {isConnecting && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                      Connecting...
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            New to Solana wallets?{' '}
            <button
              onClick={() => window.open('https://solana.com/wallets', '_blank')}
              className="text-primary hover:underline"
            >
              Learn more
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};