import { createContext, useContext, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const SolanaWalletContext = createContext<{
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  connect: () => void;
  disconnect: () => void;
  signTransaction: any;
  signAllTransactions: any;
}>({
  connected: false,
  connecting: false,
  publicKey: null,
  connect: () => {},
  disconnect: () => {},
  signTransaction: null,
  signAllTransactions: null,
});

export const useSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within SolanaWalletProvider');
  }
  return context;
};

interface SolanaWalletProviderProps {
  children: ReactNode;
}

const WalletContextProvider = ({ children }: { children: ReactNode }) => {
  const { connected, connecting, publicKey, connect, disconnect, signTransaction, signAllTransactions } = useWallet();
  
  return (
    <SolanaWalletContext.Provider 
      value={{
        connected,
        connecting,
        publicKey: publicKey?.toString() || null,
        connect,
        disconnect,
        signTransaction,
        signAllTransactions,
      }}
    >
      {children}
    </SolanaWalletContext.Provider>
  );
};

export const SolanaWalletProvider = ({ children }: SolanaWalletProviderProps) => {
  const network = 'devnet'; // Use devnet for testing
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
      new SolletWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};