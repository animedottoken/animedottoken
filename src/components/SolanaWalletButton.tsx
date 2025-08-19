import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { Button } from '@/components/ui/button';

export const SolanaWalletButton = () => {
  const { connected, connecting, publicKey, connect, disconnect } = useSolanaWallet();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Connected: {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </div>
        <Button onClick={disconnect} variant="outline">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={connect} 
      disabled={connecting}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};