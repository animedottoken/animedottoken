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
  rememberWallet: boolean;
  connect: () => Promise<void>;
  connectPaymentWallet: () => Promise<void>;
  openWalletSelector: () => void;
  linkIdentityWallet: (walletAddress: string) => Promise<boolean>;
  signMessage: (message: string) => Promise<string>;
  disconnect: () => void;
  setRememberWallet: (remember: boolean) => void;
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
  rememberWallet: false,
  connect: async () => {},
  connectPaymentWallet: async () => {},
  openWalletSelector: () => {},
  linkIdentityWallet: async () => false,
  signMessage: async () => '',
  disconnect: () => {},
  setRememberWallet: () => {},
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
  const { publicKey, connected, connecting, connect: walletConnect, disconnect: walletDisconnect, wallets, select, wallet, signMessage } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [rememberWallet, setRememberWallet] = useState(() => {
    return localStorage.getItem('remember-wallet') === 'true';
  });
  const network = 'devnet';

  // Fetch balance when wallet connects
  useEffect(() => {
    console.log('🔵 Wallet state changed - Connected:', connected, 'PublicKey:', publicKey?.toBase58());
    
    const fetchBalance = async () => {
      if (publicKey && connected) {
        try {
          console.log('🔵 Fetching balance for:', publicKey.toBase58());
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
          console.log('🟢 Balance fetched:', balance / LAMPORTS_PER_SOL, 'SOL');
        } catch (error) {
          console.error('🔴 Error fetching balance:', error);
        }
      } else {
        setBalance(0);
      }
    };

    fetchBalance();
  }, [publicKey, connected, connection]);

  // Note: We no longer auto-link wallets on connect
  // Wallets are now connected temporarily for payments or explicitly linked for identity

  const connect = useCallback(async () => {
    console.log('🔵 Wallet connect called');
    try {
      // Always show wallet selector if no wallet is selected, 
      // remember preference is off, or multiple wallets available
      const availableWallets = wallets.filter(w => w.readyState === 'Installed');
      console.log('🔵 Available wallets:', availableWallets.map(w => w.adapter.name));
      console.log('🔵 Current wallet:', wallet?.adapter.name);
      console.log('🔵 Remember wallet:', rememberWallet);
      
      if (!wallet || !rememberWallet || availableWallets.length > 1) {
        console.log('🔵 Opening wallet selector modal');
        setVisible(true);
        return;
      }

      console.log('🔵 Attempting to connect with selected wallet');
      await walletConnect();
      console.log('🟢 Wallet connected successfully');
    } catch (error) {
      console.log('🔴 Wallet connection error:', error);
      // Only show error toast for actual connection failures, not wallet selection issues
      if (error instanceof WalletNotConnectedError || (error as any)?.name === 'WalletNotSelectedError') {
        console.log('🔵 Showing wallet selector due to connection error');
        setVisible(true);
      } else {
        console.error('Wallet connection error:', error);
        toast.error('Failed to connect wallet');
      }
    }
  }, [walletConnect, wallet, setVisible, rememberWallet, wallets]);

  const disconnect = useCallback(() => {
    walletDisconnect();
    // Clear wallet selection and remember preference when manually disconnecting
    if (!rememberWallet) {
      // Clear the adapter's last wallet selection
      select(null);
    }
    localStorage.removeItem('remember-wallet');
    setRememberWallet(false);
    toast.info('Wallet disconnected');
  }, [walletDisconnect, rememberWallet, select]);

  const handleSetRememberWallet = useCallback((remember: boolean) => {
    setRememberWallet(remember);
    if (remember) {
      localStorage.setItem('remember-wallet', 'true');
    } else {
      localStorage.removeItem('remember-wallet');
    }
  }, []);

  const listProviders = useCallback(() => {
    return wallets.map(wallet => ({
      name: wallet.adapter.name,
      icon: wallet.adapter.icon,
      url: wallet.adapter.url
    }));
  }, [wallets]);

  const connectPaymentWallet = useCallback(async () => {
    try {
      if (!wallet) {
        // No wallet selected, open the selection modal
        setVisible(true);
        return;
      }
      await walletConnect();
      toast.success('Payment wallet connected');
    } catch (error) {
      if (error instanceof WalletNotConnectedError || (error as any)?.name === 'WalletNotSelectedError') {
        setVisible(true);
      } else {
        console.error('Payment wallet connection error:', error);
        toast.error('Failed to connect payment wallet');
      }
    }
  }, [walletConnect, wallet, setVisible]);

  const handleSignMessage = useCallback(async (message: string): Promise<string> => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected or signing not supported');
    }

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      
      // Convert signature to base58 string (required by our backend)
      // We need to use bs58 to encode the signature bytes
      const bs58 = await import('bs58');
      const base58Signature = bs58.default.encode(signature);
      return base58Signature;
    } catch (error) {
      console.error('Message signing error:', error);
      throw new Error('Failed to sign message');
    }
  }, [publicKey, signMessage]);

  const linkIdentityWallet = useCallback(async (walletAddress: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in first");
      return false;
    }

    if (!publicKey || !signMessage) {
      toast.error("Please connect your wallet first");
      return false;
    }

    try {
      const timestamp = Date.now();
      const signatureMessage = `Link identity wallet to ANIME.TOKEN account: ${user.email}\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
      
      // Request real signature from wallet
      const signature = await handleSignMessage(signatureMessage);

      const { data, error } = await supabase.functions.invoke('link-identity-wallet', {
        body: {
          wallet_address: walletAddress,
          signature_message: signatureMessage,
          wallet_signature: signature
        }
      });

      if (error) {
        if (error.code === 'WALLET_ALREADY_LINKED') {
          toast.error(error.message);
        } else {
          toast.error('Failed to link identity wallet');
        }
        return false;
      }

      toast.success('Identity wallet linked successfully!');
      return true;
    } catch (error) {
      console.error('Identity wallet linking error:', error);
      toast.error('Failed to link identity wallet - signature required');
      return false;
    }
  }, [user, publicKey, signMessage, handleSignMessage]);

  const openWalletSelector = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

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
    rememberWallet,
    connect,
    connectPaymentWallet,
    openWalletSelector,
    linkIdentityWallet,
    signMessage: handleSignMessage,
    disconnect,
    setRememberWallet: handleSetRememberWallet,
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
    () => {
      console.log('🔵 Initializing wallet adapters');
      const adapters = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter({ network }),
        new TrustWalletAdapter(),
      ];
      console.log('🔵 Created wallet adapters:', adapters.map(w => w.name));
      return adapters;
    },
    [network]
  );

  console.log('🔵 SolanaWalletProvider rendering with endpoint:', endpoint);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <SolanaWalletInnerProvider>
            {children}
          </SolanaWalletInnerProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};