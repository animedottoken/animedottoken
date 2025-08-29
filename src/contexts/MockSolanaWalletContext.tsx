import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
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
  walletName: string | null;
  walletIcon: string | null;
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
  walletName: null,
  walletIcon: null,
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
  const { publicKey, connected, connecting, connect: walletConnect, disconnect: walletDisconnect, wallets, select, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
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
      if (!wallet) {
        // No wallet selected, open the selection modal
        setVisible(true);
        return;
      }
      await walletConnect();
    } catch (error) {
      // Only show error toast for actual connection failures, not wallet selection issues
      if (error instanceof WalletNotConnectedError || (error as any)?.name === 'WalletNotSelectedError') {
        setVisible(true);
      } else {
        console.error('Wallet connection error:', error);
        toast.error('Failed to connect wallet');
      }
    }
  }, [walletConnect, wallet, setVisible]);

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
    try {
      // Find the specific wallet adapter by name
      const selectedWallet = wallets.find(w => 
        w.adapter.name.toLowerCase() === providerName.toLowerCase() ||
        w.adapter.name.toLowerCase().includes(providerName.toLowerCase())
      );
      
      if (selectedWallet) {
        // Select the wallet first
        select(selectedWallet.adapter.name);
        // Wait a bit for the selection to take effect, then connect
        setTimeout(async () => {
          try {
            await walletConnect();
          } catch (error) {
            console.error('Wallet connection error:', error);
            toast.error(`Failed to connect to ${providerName}`);
          }
        }, 100);
      } else {
        // Wallet not found, show selection modal
        setVisible(true);
      }
    } catch (error) {
      console.error('Wallet selection error:', error);
      toast.error(`Failed to select ${providerName} wallet`);
    }
  }, [wallets, select, walletConnect, setVisible]);

  const value = {
    connected,
    connecting,
    publicKey: publicKey?.toBase58() || null,
    balance,
    network,
    walletName: wallet?.adapter.name || null,
    walletIcon: wallet?.adapter.icon || null,
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