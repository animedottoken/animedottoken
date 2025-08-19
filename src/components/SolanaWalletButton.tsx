import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

export const SolanaWalletButton = () => {
  const { connected, publicKey } = useSolanaWallet();

  return (
    <div className="wallet-adapter-button-wrapper">
      <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-none !rounded-md !font-medium !px-4 !py-2 !h-auto !transition-colors" />
      {connected && publicKey && (
        <div className="mt-2 text-sm text-muted-foreground">
          Connected: {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </div>
      )}
    </div>
  );
};