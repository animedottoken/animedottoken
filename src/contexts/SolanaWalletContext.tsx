import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';

interface SolanaWalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const SolanaWalletContext = createContext<SolanaWalletContextType>({
  connected: false,
  connecting: false,
  publicKey: null,
  connect: async () => {},
  disconnect: () => {},
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

export const SolanaWalletProvider = ({ children }: SolanaWalletProviderProps) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  // Auto-connect Phantom if already trusted and keep state in sync
  useEffect(() => {
    const { solana } = window as any;
    if (!solana || !solana.isPhantom) return;

    const handleConnect = (pk: any) => {
      const key = (pk?.publicKey?.toString?.() ?? pk?.toString?.()) || null;
      if (key) {
        setPublicKey(key);
        setConnected(true);
      }
    };
    const handleDisconnect = () => {
      setConnected(false);
      setPublicKey(null);
    };

    solana.connect({ onlyIfTrusted: true }).then(handleConnect).catch(() => {});
    try {
      solana.on('connect', handleConnect);
      solana.on('disconnect', handleDisconnect);
    } catch {}

    return () => {
      try {
        solana.off?.('connect', handleConnect);
        solana.off?.('disconnect', handleDisconnect);
      } catch {}
    };
  }, []);

  const connect = useCallback(async () => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      
      // Check if Phantom wallet is available
      const { solana } = window as any;
      
      if (!solana || !solana.isPhantom) {
        alert('Phantom wallet not found! Please install Phantom wallet from https://phantom.app/');
        return;
      }

      // Request connection to wallet
      const response = await solana.connect();
      setPublicKey(response.publicKey.toString());
      setConnected(true);
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect to wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  }, [connecting]);

  const disconnect = useCallback(() => {
    const { solana } = window as any;
    if (solana) {
      solana.disconnect();
    }
    setConnected(false);
    setPublicKey(null);
  }, []);

  return (
    <SolanaWalletContext.Provider 
      value={{
        connected,
        connecting,
        publicKey,
        connect,
        disconnect,
      }}
    >
      {children}
    </SolanaWalletContext.Provider>
  );
};