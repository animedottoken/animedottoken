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

  // Listen ONLY for external disconnects to avoid auto-connecting
  useEffect(() => {
    const { solana } = window as any;
    if (!solana || !solana.isPhantom) return;

    const handleDisconnect = () => {
      setConnected(false);
      setPublicKey(null);
    };

    try {
      solana.on('disconnect', handleDisconnect);
    } catch {}

    return () => {
      try {
        solana.off?.('disconnect', handleDisconnect);
      } catch {}
    };
  }, []);

  const connect = useCallback(async () => {
    if (connecting) return;
    try {
      setConnecting(true);
      const { solana } = window as any;
      if (!solana || !solana.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        alert('Phantom wallet not found! Please install Phantom wallet and refresh the page.');
        return;
      }

      // Ensure a fresh selection every time
      try {
        await solana.disconnect();
        setConnected(false);
        setPublicKey(null);
      } catch {}

      await new Promise((r) => setTimeout(r, 100));

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
