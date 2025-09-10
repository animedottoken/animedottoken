import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LinkWalletDialog } from '@/components/LinkWalletDialog';
import { Wallet, LinkIcon, AlertTriangle } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useUserWallets } from '@/hooks/useUserWallets';
import { truncateAddress } from '@/utils/addressUtils';

export const IdentityWalletSection = () => {
  const { connected, publicKey } = useSolanaWallet();
  const { getPrimaryWallet } = useUserWallets();
  const [linkWalletOpen, setLinkWalletOpen] = useState(false);

  // Check for wallet intent from URL parameters or sessionStorage  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlIntent = urlParams.get('intent');
    const sessionIntent = sessionStorage.getItem('wallet-intent');
    const intent = urlIntent || sessionIntent;
    
    if (intent && intent.includes('link-primary')) {
      console.log('🎯 Auto-opening LinkWalletDialog for primary wallet from intent:', intent);
      
      setLinkWalletOpen(true);
      
      // Clear intent from sessionStorage to prevent repeated opens
      sessionStorage.removeItem('wallet-intent');
      
      // Clean up URL parameter if it exists
      if (urlIntent) {
        urlParams.delete('intent');
        const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}${window.location.hash}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  const primaryWallet = getPrimaryWallet();
  const hasLinkedWallet = primaryWallet?.wallet_address;
  const isCurrentWalletLinked = hasLinkedWallet && publicKey === primaryWallet?.wallet_address;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Identity Wallet
        </CardTitle>
        <CardDescription>
          Link your main wallet for NFT and collection ownership verification. This creates a 1:1 mapping between your account and wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasLinkedWallet ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-mono text-sm">
                    {truncateAddress(hasLinkedWallet || '')}
                  </div>
                  <div className="text-xs text-muted-foreground">Identity Wallet</div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Linked
              </Badge>
            </div>
            
            {connected && !isCurrentWalletLinked && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have a different wallet connected. Your identity wallet remains {truncateAddress(hasLinkedWallet || '')}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No identity wallet linked. You won't be able to verify ownership of NFTs or collections.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => setLinkWalletOpen(true)}
              className="w-full"
            >
              Connect & Link Primary Wallet
            </Button>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• This wallet will be used to verify ownership of your NFTs and collections</p>
          <p>• Only one wallet can be linked per account for security</p>
          <p>• For payments, you can use any wallet without changing your identity</p>
        </div>

        {/* Link Wallet Dialog */}
        <LinkWalletDialog
          open={linkWalletOpen}
          onOpenChange={setLinkWalletOpen}
          walletType="primary"
        />
      </CardContent>
    </Card>
  );
};