import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaWalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number;
  network: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  listProviders: () => any[];
  connectWith: (providerName: string) => Promise<void>;
}

const SolanaWalletContext = createContext<SolanaWalletContextType>({
  connected: false,
  connecting: false,
  publicKey: null,
  balance: 0,
  network: 'devnet',
  connect: async () => {},
  disconnect: () => {},
  listProviders: () => [],
  connectWith: async () => {},
});

export const useSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within SolanaWalletProvider');
  }
  return context;
};

const SolanaWalletInnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, connected, connecting, connect: walletConnect, disconnect: walletDisconnect, wallets } = useWallet();
  const { connection } = useConnection();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const network = 'devnet';

  // Fetch balance when wallet connects
  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey && connected) {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      } else {
        setBalance(0);
      }
    };

    fetchBalance();
  }, [publicKey, connected, connection]);

  // Update profile with wallet address when wallet connects
  useEffect(() => {
    const updateProfile = async () => {
      if (publicKey && connected && user) {
        try {
          await supabase.functions.invoke('upsert-profile', {
            body: {
              wallet_address: publicKey.toBase58()
            }
          });
          toast.success('Wallet connected successfully!');
        } catch (error) {
          console.error('Error updating profile:', error);
        }
      }
    };

    updateProfile();
  }, [publicKey, connected, user]);

  const connect = useCallback(async () => {
    try {
      await walletConnect();
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  }, [walletConnect]);

  const disconnect = useCallback(() => {
    walletDisconnect();
    toast.info('Wallet disconnected');
  }, [walletDisconnect]);

  const listProviders = useCallback(() => {
    return wallets.map(wallet => ({
      name: wallet.adapter.name,
      icon: wallet.adapter.icon,
      url: wallet.adapter.url
    }));
  }, [wallets]);

  const connectWith = useCallback(async (providerName: string) => {
    // For now, just use the default connect - wallet selection is handled by the modal
    await connect();
  }, [connect]);

  const value = {
    connected,
    connecting,
    publicKey: publicKey?.toBase58() || null,
    balance,
    network,
    connect,
    disconnect,
    listProviders,
    connectWith,
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
};

export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TrustWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaWalletInnerProvider>
            {children}
          </SolanaWalletInnerProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};