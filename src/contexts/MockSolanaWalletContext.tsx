import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletNotConnectedError, WalletReadyState, type Adapter } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-unsafe-burner';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaWalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number;
  network: string;
  cluster: 'mainnet' | 'devnet';
  walletName: string | null;
  walletIcon: string | null;
  rememberWallet: boolean;
  wallet: any; // Expose wallet adapter for Metaplex
  connection: any; // Expose connection for transactions
  signTransaction: ((transaction: any) => Promise<any>) | null; // Expose signTransaction for payments
  connect: () => Promise<void>;
  connectPaymentWallet: (intent?: string) => Promise<void>;
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
  cluster: 'devnet',
  walletName: null,
  walletIcon: null,
  rememberWallet: false,
  wallet: null,
  connection: null,
  signTransaction: null,
  connect: async () => {},
  connectPaymentWallet: async (_intent?: string) => {},
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
  const { publicKey, connected, connecting, connect: walletConnect, disconnect: walletDisconnect, wallets, select, wallet, signMessage, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { user } = useAuth();
  const { cluster } = useEnvironment();
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [connectAfterSelection, setConnectAfterSelection] = useState(false);
  const [rememberWallet, setRememberWallet] = useState(() => {
    // Default to ON for better user experience (auto-reconnect by default)
    const stored = localStorage.getItem('remember-wallet');
    const remember = stored !== null ? stored === 'true' : true;
    
    // Set default value if not already set
    if (stored === null) {
      localStorage.setItem('remember-wallet', 'true');
    }
    
    // If remember is OFF, proactively clear any persisted wallet data
    if (!remember) {
      localStorage.removeItem('walletName');
      localStorage.removeItem('walletAdapter');
    }
    
    return remember;
  });
  const network = cluster === 'mainnet' ? 'mainnet-beta' : 'devnet';

  // Note: We no longer auto-link wallets on connect
  // Wallets are now connected temporarily for payments or explicitly linked for identity


  // Auto-connect after wallet selection
  useEffect(() => {
    if (connectAfterSelection && wallet && !connected && !connecting) {
      console.log('🚀 Auto-connecting to selected wallet:', wallet.adapter.name);
      setConnectAfterSelection(false);
      walletConnect()
        .then(() => {
          console.log('✅ Auto-connect successful');
          toast.success(`Connected to ${wallet.adapter.name}`);
          // Notify app immediately for UI that relies on first-connection
          try { window.dispatchEvent(new CustomEvent('wallet-connected')); } catch {}
          
          // Save wallet preference if remember is enabled
          if (rememberWallet) {
            localStorage.setItem('walletName', wallet.adapter.name);
          }
        })
        .catch((error) => {
          console.error('❌ Auto-connect failed:', error);
          toast.error('Failed to connect wallet');
        });
    }
  }, [connectAfterSelection, wallet, connected, connecting, walletConnect, rememberWallet]);

  // Silent auto-reconnect on load when remember is enabled
  useEffect(() => {
    if (!rememberWallet || connected || connecting) return;
    const lastWallet = localStorage.getItem('walletName');
    if (!lastWallet) return;
    const saved = wallets.find(w => w.adapter.name === lastWallet);
    if (!saved) return;
    if (saved.readyState === WalletReadyState.Installed || saved.readyState === WalletReadyState.Loadable) {
      try {
        select(saved.adapter.name);
        setTimeout(async () => {
          try {
            await walletConnect();
            toast.success(`Reconnected to ${lastWallet}`);
            try { window.dispatchEvent(new CustomEvent('wallet-connected')); } catch {}
          } catch (e) {
            console.warn('Silent auto-reconnect failed:', e);
          }
        }, 100);
      } catch (e) {
        console.warn('Failed to select saved wallet adapter:', e);
      }
    }
  }, [rememberWallet, connected, connecting, wallets, select, walletConnect]);

  // Auto-open wallet modal and handle intents from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const openWalletModal = urlParams.get('openWalletModal');
    const intent = urlParams.get('intent');
    const connectWallet = urlParams.get('connectWallet');
    
    // Store intent in sessionStorage for components to pick up
    if (intent) {
      console.log('📝 Storing wallet intent:', intent);
      sessionStorage.setItem('wallet-intent', intent);
    }
    
    // Auto-open wallet modal if requested
    if (openWalletModal === '1' && !connected && !connecting) {
      console.log('🎯 Auto-opening wallet modal from URL parameter');
      
      // Clean up URL parameters
      urlParams.delete('openWalletModal');
      urlParams.delete('intent');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
      
      // Open wallet modal with auto-connect flag
      setConnectAfterSelection(true);
      setVisible(true);
      return;
    }
    
    // Legacy connectWallet parameter handling
    if (connectWallet && !connected && !connecting && wallets.length > 0) {
      console.log('🔗 Auto-connecting from URL parameter:', connectWallet);
      
      // Remove the parameter from URL to clean up
      urlParams.delete('connectWallet');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
      
      // Find and connect to the specified wallet
      const targetWallet = wallets.find(w => 
        w.adapter.name.toLowerCase().includes(connectWallet.toLowerCase())
      );
      
      if (targetWallet) {
        select(targetWallet.adapter.name);
        setTimeout(async () => {
          try {
            await walletConnect();
            toast.success(`Connected to ${targetWallet.adapter.name}`);
          } catch (error) {
            console.error('❌ URL auto-connect failed:', error);
            toast.error(`Failed to connect to ${connectWallet}`);
          }
        }, 100);
      }
    }
  }, [wallets, connected, connecting, select, walletConnect, setVisible]);

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
      
      // Only auto-connect to remembered wallet if remember setting is ON
      if (rememberWallet) {
        const lastWallet = localStorage.getItem('walletName');
        if (lastWallet) {
          const savedWallet = wallets.find(w => w.adapter.name === lastWallet);
          if (savedWallet && (savedWallet.readyState === WalletReadyState.Installed || savedWallet.readyState === WalletReadyState.Loadable)) {
            console.log('🎯 Auto-connecting to remembered wallet:', lastWallet);
            try {
              select(savedWallet.adapter.name);
              setTimeout(async () => {
                try {
                  await walletConnect();
                  toast.success(`Connected to ${lastWallet}`);
                } catch (error) {
                  console.error('❌ Auto-connect failed, opening modal:', error);
                  setConnectAfterSelection(true);
                  setVisible(true);
                }
              }, 100);
              return;
            } catch (error) {
              console.error('❌ Remembered wallet connection failed:', error);
            }
          }
        }
      } else {
        // If remember is OFF, ensure no persisted wallet data exists
        localStorage.removeItem('walletName');
        localStorage.removeItem('walletAdapter');
        console.log('🚫 Remember wallet is OFF - cleared persisted data');
      }
      
      // Open wallet selection modal
      console.log('🎯 Opening wallet selection modal...');
      setConnectAfterSelection(true);
      setVisible(true);
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    }
  }, [setVisible, wallets, rememberWallet, select, walletConnect]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting wallet...');
    walletDisconnect();
    // Always clear the selected adapter to prevent stale state
    select(null);
    // Clear auto-connect flag when disconnecting
    setConnectAfterSelection(false);
    // Only clear storage if remember is OFF
    if (!rememberWallet) {
      localStorage.removeItem('walletName');
      localStorage.removeItem('walletAdapter');
    }
    try { window.dispatchEvent(new CustomEvent('wallet-disconnected')); } catch {}
    toast.info('Wallet disconnected');
    console.log('✅ Wallet disconnected');
  }, [walletDisconnect, select, rememberWallet]);

  const handleSetRememberWallet = useCallback((remember: boolean) => {
    setRememberWallet(remember);
    if (remember) {
      localStorage.setItem('remember-wallet', 'true');
    } else {
      // When remember is OFF, clear ALL wallet-related storage
      localStorage.removeItem('remember-wallet');
      localStorage.removeItem('walletName');
      localStorage.removeItem('walletAdapter');
      
      // If currently connected, disconnect to prevent auto-reconnection
      if (connected) {
        console.log('🔌 Disconnecting wallet due to remember setting OFF');
        walletDisconnect();
        select(null);
        toast.info('Wallet disconnected - remember setting is OFF');
      }
    }
  }, [connected, walletDisconnect, select]);

  const listProviders = useCallback(() => {
    const installedWallets = wallets
      .filter(w =>
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable
      )
      .map(w => w.adapter.name);
    
    return {
      installed: installedWallets,
      hasPreview: false // No preview wallet available
    };
  }, [wallets]);

  const connectPaymentWallet = useCallback(async (intent?: string) => {
    try {
      setError(null);
      console.log('💳 Attempting payment wallet connection...', { intent });

      // If already connected, do nothing
      if (connected) {
        console.log('✅ Wallet already connected');
        toast.success('Wallet already connected');
        return;
      }

      // Small delay to let post-login UI settle (prevents stale states)
      await new Promise((r) => setTimeout(r, 120));
      
      // If adapter is in a stale "connecting" state right after login, wait briefly then reset
      if (connecting) {
        console.log('⏳ Wallet is currently connecting; waiting to settle...');
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 100));
          if (!connecting) break;
        }
        if (connecting) {
          console.log('🧹 Still connecting after wait; resetting adapter');
          try { await walletDisconnect(); } catch (_) {}
          try { select(null); } catch (_) {}
        }
      }

      // Check if we're in an iframe
      const isInIframe = typeof window !== 'undefined' && window !== window.parent;

      // For linking intents in iframes, force new tab to ensure extension popups work
      if (isInIframe && intent && intent.includes('link')) {
        console.log('🔗 Forcing new tab for linking intent in iframe');
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('openWalletModal', '1');
        currentUrl.searchParams.set('intent', intent);
        
        const newWindow = window.open(currentUrl.toString(), '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          toast.error('Please allow popups for wallet linking');
        } else {
          toast.info('Opening in new tab for wallet linking...');
        }
        return;
      }

      // For regular payment flows in iframe, just show suggestion
      if (isInIframe && !intent) {
        toast.info('For best wallet experience, open in new tab', {
          action: {
            label: 'Open in New Tab',
            onClick: () => window.open(window.location.href, '_blank')
          }
        });
      }

      // Proactively disconnect and clear selection to avoid stale adapters
      try { await walletDisconnect(); } catch (_) {}
      try { select(null); } catch (_) {}

      // Direct auto-connect removed to always let the user choose a wallet
      // We will always open the wallet selector below and connect only after explicit choice.
      
      // Open the wallet modal with auto-connect flag (fallback)
      console.log('🎯 Opening wallet modal for payment...');
      setConnectAfterSelection(true);
      setVisible(true);

      // Fallbacks to ensure modal reliably opens on the very first attempt after login
      try {
        requestAnimationFrame(() => setVisible(true));
        setTimeout(() => setVisible(true), 150);
        setTimeout(() => setVisible(true), 400);
      } catch {}
      
    } catch (error) {
      console.error('💳 Payment wallet connection error:', error);
      toast.error('Failed to open wallet selector');
    }
  }, [select, setVisible, connected, connecting, walletDisconnect, wallets, walletConnect]);

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
      const signatureMessage = `Link identity wallet to ANIME.TOKEN account\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
      
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
          try { window.dispatchEvent(new CustomEvent('wallet-connected')); } catch {}
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
    cluster,
    walletName: wallet?.adapter.name || null,
    walletIcon: wallet?.adapter.icon || null,
    rememberWallet,
    wallet, // Expose wallet adapter for Metaplex
    connection, // Expose connection for transactions
    signTransaction: signTransaction || null, // Expose signTransaction for payments
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
  const { cluster } = useEnvironment();
  const network = cluster === 'mainnet' ? WalletAdapterNetwork.Mainnet : WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  const wallets = useMemo(() => {
    // Only include Phantom and Solflare as requested
    const baseWallets: Adapter[] = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ];

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