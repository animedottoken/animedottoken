import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletNotConnectedError, WalletReadyState, type Adapter } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-unsafe-burner';
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
  listProviders: () => { installed: string[]; hasPreview: boolean };
  connectWith: (providerName: string) => Promise<void>;
  error: string | null;
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
  listProviders: () => ({ installed: [], hasPreview: false }),
  connectWith: async () => {},
  error: null,
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
  const [error, setError] = useState<string | null>(null);
  const [connectAfterSelection, setConnectAfterSelection] = useState(false);
  const [rememberWallet, setRememberWallet] = useState(() => {
    return localStorage.getItem('remember-wallet') === 'true';
  });
  const network = 'devnet';

  // Note: We no longer auto-link wallets on connect
  // Wallets are now connected temporarily for payments or explicitly linked for identity

  const airdropSOL = useCallback(async (publicKey: any) => {
    try {
      console.log('💰 Airdropping 1 SOL to preview wallet...');
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      console.log('✅ Airdrop successful:', signature);
      toast.success('Preview wallet funded with 1 SOL');
      
      // Refresh balance
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('❌ Airdrop failed:', error);
      // Don't show error toast - this is best effort
    }
  }, [connection]);


  // Auto-connect after wallet selection
  useEffect(() => {
    if (connectAfterSelection && wallet && !connected && !connecting) {
      console.log('🚀 Auto-connecting to selected wallet:', wallet.adapter.name);
      setConnectAfterSelection(false);
      walletConnect()
        .then(() => {
          console.log('✅ Auto-connect successful');
          toast.success(`Connected to ${wallet.adapter.name}`);
        })
        .catch((error) => {
          console.error('❌ Auto-connect failed:', error);
          toast.error('Failed to connect wallet');
        });
    }
  }, [connectAfterSelection, wallet, connected, connecting, walletConnect]);

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

  const connect = useCallback(async () => {
    setError(null);
    try {
      console.log('🔗 Attempting wallet connection...');
      console.log('🖼️ Is in iframe:', window !== window.parent);
      console.log('🌐 Origin:', window.location.origin);
      console.log('💼 Available wallets:', wallets.map(w => ({ name: w.adapter.name, ready: w.readyState })));
      
      const isInIframe = window !== window.parent;
      const isDevnet = network === 'devnet';
      const hasInstalledWallets = wallets.some(w => (w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable) && !/unsafe|burner/i.test(w.adapter.name));
      const previewWallet = wallets.find(w => /unsafe|burner/i.test(w.adapter.name));
      
      console.log('🎯 Has installed wallets:', hasInstalledWallets);
      console.log('🎭 Preview wallet available:', !!previewWallet);
      
      // Try installed wallets first
      if (hasInstalledWallets) {
        console.log('✅ Attempting inline wallet connection...');
        
        try {
          setVisible(true);
          console.log('🎉 Wallet modal opened successfully');
          
          return;
        } catch (inlineError) {
          console.error('❌ Inline connection failed:', inlineError);
          if (!isInIframe) {
            throw inlineError;
          }
        }
      }
      
      // Fallback: open wallet selection modal inline
      console.log('ℹ️ Opening wallet modal for selection...');
      setVisible(true);
      return;
      
      throw new Error('Unable to connect wallet');
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    }
  }, [setVisible, wallets, network, connected, connecting]);

  const disconnect = useCallback(() => {
    walletDisconnect();
    // Clear auto-connect flag when disconnecting
    setConnectAfterSelection(false);
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
    const installedWallets = wallets
      .filter(w => 
        // Always expose primary wallets in UI regardless of readyState
        !/unsafe|burner/i.test(w.adapter.name)
      )
      .map(w => w.adapter.name);
    
    const previewWallet = wallets.find(w => /unsafe|burner/i.test(w.adapter.name));
    return {
      installed: installedWallets,
      hasPreview: !!previewWallet
    };
  }, [wallets]);

  const connectPaymentWallet = useCallback(async () => {
    try {
      // Always open wallet selector for reliable connection
      console.log('🎯 Opening wallet selector for connection...');
      setVisible(true);
      toast.info('Select a wallet to continue');
    } catch (error) {
      console.error('Payment wallet connection error:', error);
      toast.error('Failed to open wallet selector');
    }
  }, [setVisible]);

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
    setError(null);
    try {
      console.log(`🎯 Attempting direct connection to ${providerName}...`);
      console.log('🖼️ Is in iframe:', window !== window.parent);
      
      const selectedWallet = wallets.find(w => 
        w.adapter.name.toLowerCase() === providerName.toLowerCase() ||
        w.adapter.name.toLowerCase().includes(providerName.toLowerCase())
      );
      
      if (!selectedWallet) {
        const available = wallets.map(w => ({ name: w.adapter.name, ready: w.readyState }));
        console.warn(`⚠️ ${providerName} not found among adapters`, available);
        const msg = `${providerName} wallet not available`;
        setError(msg);
        toast.error(msg);
        return;
      }

      // Proactively disconnect any previously selected wallet to avoid adapter conflicts
      try {
        await walletDisconnect();
      } catch (_) {}

      console.log(`✅ Found ${providerName} (ready: ${selectedWallet.readyState}), selecting...`);
      select(selectedWallet.adapter.name);

      setTimeout(async () => {
        try {
          console.log(`🔗 Connecting to ${providerName}...`);
          await walletConnect();
          console.log(`✅ Successfully connected to ${providerName}`);
          toast.success(`Connected to ${providerName}`);
        } catch (error: any) {
          console.error(`❌ Wallet connection error for ${providerName}:`, error);
          const errorMessage = error instanceof Error ? error.message : (error?.toString?.() ?? 'Unknown error');
          console.log(`🔍 Error details:`, { name: error?.name, message: errorMessage, stack: error?.stack, readyState: selectedWallet.readyState });
          const msg = `Failed to connect to ${providerName}: ${errorMessage}`;
          setError(msg);
          toast.error(msg);
        }
      }, 50);
    } catch (error) {
      console.error('Wallet selection error:', error);
      const msg = `Failed to select ${providerName} wallet`;
      setError(msg);
      toast.error(msg);
    }
  }, [wallets, select, walletConnect, walletDisconnect]);

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
    error,
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
  
  const wallets = useMemo(() => {
    const baseWallets: Adapter[] = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TrustWalletAdapter(),
    ];

    // Always add Preview Wallet (Unsafe Burner) on Devnet for testing
    const isDevnet = network === WalletAdapterNetwork.Devnet;
    
    if (isDevnet) {
      baseWallets.push(new UnsafeBurnerWalletAdapter());
    }

    return baseWallets;
  }, [network]);

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