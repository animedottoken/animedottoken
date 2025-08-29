import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface SolanaWalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number;
  network: string;
  airdropping: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  airdrop: () => Promise<void>;
  listProviders: () => any[];
  connectWith: (providerName: string) => Promise<void>;
}

const SolanaWalletContext = createContext<SolanaWalletContextType>({
  connected: false,
  connecting: false,
  publicKey: null,
  balance: 0,
  network: 'devnet',
  airdropping: false,
  connect: async () => {},
  disconnect: () => {},
  airdrop: async () => {},
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

export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [airdropping, setAirdropping] = useState(false);
  const network = 'devnet';

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      // Mock connection
      setTimeout(() => {
        setConnected(true);
        // Use a valid-looking Solana address (base58, no masking) for dev
        setPublicKey('9xQeWvG816bUx9EPK9f5sG3wFyaD1VhXhHn3QpD5sGhR');
        setBalance(1.5);
        setConnecting(false);
        toast.success('Mock wallet connected successfully!');
      }, 1000);
    } catch (error) {
      setConnecting(false);
      toast.error('Failed to connect mock wallet');
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setPublicKey(null);
    setBalance(0);
    toast.info('Mock wallet disconnected');
  }, []);

  const airdrop = useCallback(async () => {
    if (!connected) return;
    
    setAirdropping(true);
    setTimeout(() => {
      setBalance(prev => prev + 1);
      setAirdropping(false);
      toast.success('Mock airdrop successful! +1 SOL');
    }, 1500);
  }, [connected]);

  const listProviders = useCallback(() => {
    return [{ name: 'Mock Wallet', icon: '', url: '' }];
  }, []);

  const connectWith = useCallback(async (providerName: string) => {
    await connect();
  }, [connect]);

  const value = {
    connected,
    connecting,
    publicKey,
    balance,
    network,
    airdropping,
    connect,
    disconnect,
    airdrop,
    listProviders,
    connectWith,
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
};