import { createContext, useContext, ReactNode } from 'react';

interface EnvironmentContextType {
  isBetaMode: boolean;
  isLive: boolean;
  cluster: 'mainnet' | 'devnet';
  canUseFeature: (feature: string) => boolean;
  canUseDevnetFeatures: () => boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | null>(null);

const BETA_FEATURES = [
  // Remove wallet-linking from beta features - now available live
];

export const EnvironmentProvider = ({ children }: { children: ReactNode }) => {
  // Detect environment based on URL and params
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  
  // Force beta mode via URL param or env var
  const forceBeta = searchParams.has('beta') || 
                   ((import.meta as any).env?.VITE_FORCE_BETA === '1');
  
  // Consider staging domains (.staging.yourdomain.com) as beta
  const isStagingDomain = hostname.includes('.staging.') || hostname.includes('-staging.');
  
  // Mark specific domains as beta even if they're "production" 
  const betaProductionDomains: string[] = []; // Remove animedottoken.com - now live
  const isProductionBeta = betaProductionDomains.some(domain => hostname.includes(domain));
  
  const isBetaMode = forceBeta || 
                    isStagingDomain ||
                    isProductionBeta ||
                    hostname.includes('lovable.app') || 
                    hostname.includes('localhost') || 
                    hostname.includes('127.0.0.1');
  
  // Live is true when domain is production and not forced beta
  const isLive = !isBetaMode;
  
  // Use devnet for beta/testing, mainnet for production
  const cluster: 'mainnet' | 'devnet' = isBetaMode ? 'devnet' : 'mainnet';

  const canUseFeature = (feature: string): boolean => {
    // In beta mode, all features are available
    if (isBetaMode) return true;
    
    // In live mode, beta features are disabled
    return !BETA_FEATURES.includes(feature);
  };

  const canUseDevnetFeatures = (): boolean => {
    // Devnet features like airdrop only available on devnet
    return cluster === 'devnet';
  };

  return (
    <EnvironmentContext.Provider value={{ isBetaMode, isLive, cluster, canUseFeature, canUseDevnetFeatures }}>
      {children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within EnvironmentProvider');
  }
  return context;
};