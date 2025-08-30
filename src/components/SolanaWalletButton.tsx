import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut } from 'lucide-react';

export const SolanaWalletButton = () => {
  const { connected, connecting, publicKey, balance, walletName, connect, disconnect } = useSolanaWallet();

  if (connected && publicKey) {
    return (
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
          <Badge variant="secondary" className="text-xs">
            {walletName}
          </Badge>
        )}
        <Button onClick={disconnect} variant="outline" size="sm" className="flex items-center gap-2">
          <LogOut className="h-4 w-4 text-red-500" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={() => connect()} 
      disabled={connecting}
      className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
    >
      {connecting ? 'Connecting...' : (
        <>
          <LogIn className="h-4 w-4 text-green-500" />
          Connect Wallet
        </>
      )}
    </Button>
  );
};