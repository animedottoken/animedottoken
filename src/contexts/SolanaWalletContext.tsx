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

  // Check for existing connection but don't auto-connect
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

    // Only listen for events, don't auto-connect
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
        // Open Phantom installation page
        window.open('https://phantom.app/', '_blank');
        alert('Phantom wallet not found! Please install Phantom wallet and refresh the page.');
        return;
      }

      // Always disconnect first to ensure fresh wallet selection
      try {
        await solana.disconnect();
        // Clear any cached connection state
        setConnected(false);
        setPublicKey(null);
      } catch (error) {
        // Ignore disconnect errors
      }

      // Small delay to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force a fresh connection - this should always show wallet selection
      const response = await solana.connect({ onlyIfTrusted: false });
      
      if (response && response.publicKey) {
        setPublicKey(response.publicKey.toString());
        setConnected(true);
      } else {
        throw new Error('No wallet selected');
      }
      
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      if (error?.code === 4001 || error?.message?.includes('rejected')) {
        // User rejected the request - no need to show error
        return;
      }
      alert('Failed to connect to wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  }, [connecting]);

  const disconnect = useCallback(async () => {
    try {
      const { solana } = window as any;
      if (solana) {
        await solana.disconnect();
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      // Always clear state regardless of disconnect success
      setConnected(false);
      setPublicKey(null);
    }
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