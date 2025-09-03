import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletNotConnectedError, type Adapter } from '@solana/wallet-adapter-base';
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

  // Handle wallet-connect=1 URL parameter for new tab connections
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldConnect = urlParams.get('wallet-connect') === '1';
    const isTopLevel = window === window.parent;
    
    if (shouldConnect && isTopLevel && !connected && !connecting) {
      console.log('🎯 Auto-opening wallet modal from URL parameter...');
      const hasInstalledWallets = wallets.some(w => 
        (w.readyState === 'Installed' || w.readyState === 'Loadable') && 
        !/unsafe|burner/i.test(w.adapter.name)
      );
      
      if (hasInstalledWallets) {
        setTimeout(() => {
          setVisible(true);
        }, 500);
      }
    }
  }, [wallets, connected, connecting, setVisible]);

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
      const hasInstalledWallets = wallets.some(w => w.readyState === 'Installed' && !/unsafe|burner/i.test(w.adapter.name));
      const previewWallet = wallets.find(w => /unsafe|burner/i.test(w.adapter.name));
      
      console.log('🎯 Has installed wallets:', hasInstalledWallets);
      console.log('🎭 Preview wallet available:', !!previewWallet);
      
      // Try installed wallets first
      if (hasInstalledWallets) {
        console.log('✅ Attempting inline wallet connection...');
        
        try {
          setVisible(true);
          console.log('🎉 Wallet modal opened successfully');
          
          // If in iframe, set fallback timer
          if (isInIframe) {
            setTimeout(() => {
              if (!connected && !connecting) {
                console.log('🚀 Iframe connection timeout, opening new tab...');
                const fullAppUrl = `${window.location.origin}${window.location.pathname}?wallet-connect=1`;
                window.open(fullAppUrl, '_blank');
                toast.info('Opening wallet connection in new tab...');
              }
            }, 1200);
          }
          return;
        } catch (inlineError) {
          console.error('❌ Inline connection failed:', inlineError);
          if (!isInIframe) {
            throw inlineError;
          }
        }
      }
      
      // Fallback: open new tab (only if in iframe or no wallets detected)
      if (isInIframe || !hasInstalledWallets) {
        const reason = !hasInstalledWallets ? 'no wallets detected' : 'iframe fallback';
        console.log(`🚀 Opening full app for wallet connection (${reason})...`);
        const fullAppUrl = `${window.location.origin}${window.location.pathname}?wallet-connect=1`;
        window.open(fullAppUrl, '_blank');
        toast.info('Opening wallet connection in new tab...');
        return;
      }
      
      throw new Error('Unable to connect wallet');
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    }
  }, [setVisible, wallets, network, connected, connecting]);

  const disconnect = useCallback(() => {
    walletDisconnect();
    // Clear wallet selection and remember preference when manually disconnecting
    if (!rememberWallet) {
      // Clear the adapter's last wallet selection
      select(null);
    }
    // Clear auto-connect attempt flag so it can try again if needed
    sessionStorage.removeItem('preview-autoconnect-attempted');
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
        (w.readyState === 'Installed' || w.readyState === 'Loadable') && 
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
    setError(null);
    try {
      console.log(`🎯 Attempting direct connection to ${providerName}...`);
      console.log('🖼️ Is in iframe:', window !== window.parent);
      
      const selectedWallet = wallets.find(w => 
        w.adapter.name.toLowerCase() === providerName.toLowerCase() ||
        w.adapter.name.toLowerCase().includes(providerName.toLowerCase())
      );
      
      if (selectedWallet && (selectedWallet.readyState === 'Installed' || selectedWallet.readyState === 'Loadable')) {
        console.log(`✅ Found ${providerName} wallet, selecting...`);
        select(selectedWallet.adapter.name);
        setTimeout(async () => {
          try {
            console.log(`🔗 Connecting to ${providerName}...`);
            await walletConnect();
            console.log(`✅ Successfully connected to ${providerName}`);
            toast.success(`Connected to ${providerName}`);
          } catch (error) {
            console.error(`❌ Wallet connection error for ${providerName}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log(`🔍 Error details:`, { name: error?.name, message: errorMessage, stack: error?.stack });
            setError(`Failed to connect to ${providerName}: ${errorMessage}`);
          }
        }, 100);
      } else {
        const status = selectedWallet ? selectedWallet.readyState : 'not found';
        console.log(`❌ ${providerName} wallet status:`, status);
        setError(`${providerName} wallet not installed or not ready (status: ${status})`);
      }
    } catch (error) {
      console.error('Wallet selection error:', error);
      setError(`Failed to select ${providerName} wallet`);
    }
  }, [wallets, select, walletConnect]);

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

    // Add Preview Wallet (Unsafe Burner) for iframe and devnet only
    const isInIframe = typeof window !== 'undefined' && window !== window.parent;
    const isDevnet = network === WalletAdapterNetwork.Devnet;
    
    if (isInIframe && isDevnet) {
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