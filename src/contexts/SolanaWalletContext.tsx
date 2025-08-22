import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';

interface WalletInfo { id: string; name: string; provider: any }

interface SolanaWalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number;
  network: string;
  airdropping: boolean;
  connect: (providerId?: string) => Promise<void>;
  connectWith: (providerId: string) => Promise<void>;
  disconnect: () => void;
  airdrop: () => Promise<void>;
  listProviders: () => { id: string; name: string }[];
}

const SolanaWalletContext = createContext<SolanaWalletContextType>({
  connected: false,
  connecting: false,
  publicKey: null,
  balance: 0,
  network: 'devnet',
  airdropping: false,
  connect: async () => {},
  connectWith: async () => {},
  disconnect: () => {},
  airdrop: async () => {},
  listProviders: () => [],
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

function detectProviders(): WalletInfo[] {
  const providers: WalletInfo[] = [];
  const anyWin = window as any;
  const solana = anyWin.solana;
  const pushProvider = (p: any) => {
    const id = p?.wallet || p?.name || (p?.isPhantom ? 'phantom' : p?.isSolflare ? 'solflare' : p?.isBackpack ? 'backpack' : p?.isGlow ? 'glow' : p?.isExodus ? 'exodus' : p?.isBitgetWallet ? 'bitget' : 'unknown');
    const name = p?.name || (p?.isPhantom ? 'Phantom' : p?.isSolflare ? 'Solflare' : p?.isBackpack ? 'Backpack' : p?.isGlow ? 'Glow' : p?.isExodus ? 'Exodus' : p?.isBitgetWallet ? 'Bitget' : 'Wallet');
    providers.push({ id, name, provider: p });
  };
  if (solana?.providers?.length) {
    solana.providers.forEach(pushProvider);
  } else if (solana) {
    pushProvider(solana);
  }
  return providers;
}

export const SolanaWalletProvider = ({ children }: SolanaWalletProviderProps) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [airdropping, setAirdropping] = useState(false);
  const network = 'devnet'; // Force devnet for zero-cost testing

  // Do NOT auto-connect. Only ensure we clear state on external disconnects.
  useEffect(() => {
    const anyWin = window as any;
    const solana = anyWin.solana;
    if (!solana) return;
    const handleDisconnect = () => {
      setConnected(false);
      setPublicKey(null);
    };
    try { solana.on?.('disconnect', handleDisconnect); } catch {}
    return () => { try { solana.off?.('disconnect', handleDisconnect); } catch {} };
  }, []);

  const connectWith = useCallback(async (providerId: string) => {
    if (connecting) return;
    try {
      setConnecting(true);
      const wallets = detectProviders();
      const target = wallets.find(w => w.id === providerId) || wallets.find(w => w.name.toLowerCase() === providerId.toLowerCase());
      const p = target?.provider;
      if (!p) throw new Error('Selected wallet not available');

      // Hard reset provider state
      try { await p.disconnect?.(); } catch {}
      await new Promise(r => setTimeout(r, 150));

      const resp = await p.connect({ onlyIfTrusted: false });
      if (resp?.publicKey) {
        setPublicKey(resp.publicKey.toString());
        setConnected(true);
      } else {
        throw new Error('No wallet selected');
      }
    } finally {
      setConnecting(false);
    }
  }, [connecting]);

  const connect = useCallback(async (providerId?: string) => {
    // If provider specified, delegate to connectWith
    if (providerId) return connectWith(providerId);

    const wallets = detectProviders();
    if (wallets.length === 0) {
      window.open('https://phantom.app/', '_blank');
      alert('No Solana wallets detected. Please install a wallet (e.g., Phantom).');
      return;
    }
    if (wallets.length === 1) {
      return connectWith(wallets[0].id);
    }
    // Ask user which wallet to use (native prompt fallback)
    const choice = window.prompt(`Choose wallet:\n${wallets.map((w, i) => `${i + 1}. ${w.name}`).join('\n')}`, '1');
    const idx = choice ? parseInt(choice, 10) - 1 : -1;
    if (idx >= 0 && idx < wallets.length) {
      return connectWith(wallets[idx].id);
    }
  }, [connectWith]);

  const disconnect = useCallback(async () => {
    const wallets = detectProviders();
    for (const w of wallets) {
      try { await w.provider.disconnect?.(); } catch {}
    }
    setConnected(false);
    setPublicKey(null);
  }, []);

  const updateBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const response = await fetch('https://api.devnet.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [publicKey, { commitment: 'confirmed' }]
        })
      });
      const data = await response.json();
      const balanceInSOL = (data.result?.value || 0) / 1_000_000_000;
      setBalance(balanceInSOL);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [publicKey]);

  const airdrop = useCallback(async () => {
    if (!publicKey || airdropping) return;
    try {
      setAirdropping(true);
      const response = await fetch('https://api.devnet.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'requestAirdrop',
          params: [publicKey, 1_000_000_000] // 1 SOL
        })
      });
      const data = await response.json();
      if (data.result) {
        // Wait a moment then update balance
        setTimeout(updateBalance, 2000);
      }
    } catch (error) {
      console.error('Airdrop failed:', error);
    } finally {
      setAirdropping(false);
    }
  }, [publicKey, airdropping, updateBalance]);

  // Update balance when connected
  useEffect(() => {
    if (connected && publicKey) {
      updateBalance();
      const interval = setInterval(updateBalance, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, updateBalance]);

  const listProviders = useCallback(() => detectProviders().map(w => ({ id: w.id, name: w.name })), []);

  return (
    <SolanaWalletContext.Provider
      value={{
        connected,
        connecting,
        publicKey,
        balance,
        network,
        airdropping,
        connect,
        connectWith,
        disconnect,
        airdrop,
        listProviders,
      }}
    >
      {children}
    </SolanaWalletContext.Provider>
  );
};
