import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap } from 'lucide-react';

export const SolanaWalletButton = () => {
  const { connected, connecting, publicKey, balance, network, airdropping, connect, disconnect, airdrop } = useSolanaWallet();

  if (connected && publicKey) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {network.toUpperCase()} - Testing Mode
          </Badge>
          <div className="text-sm text-muted-foreground">
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </div>
          <div className="text-sm font-medium">
            {balance.toFixed(3)} SOL
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={airdrop} 
            disabled={airdropping}
            size="sm"
            variant="outline"
            className="border-success/30 text-success hover:bg-success/10"
          >
            <Zap className="w-4 h-4 mr-1" />
            {airdropping ? 'Airdropping...' : 'Free SOL'}
          </Button>
          <Button onClick={disconnect} variant="outline" size="sm">
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button 
      onClick={() => connect()} 
      disabled={connecting}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};