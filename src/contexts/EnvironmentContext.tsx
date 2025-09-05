import { createContext, useContext, ReactNode } from 'react';

interface EnvironmentContextType {
  isBetaMode: boolean;
  isLive: boolean;
  canUseFeature: (feature: string) => boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | null>(null);

const BETA_FEATURES = [
  'wallet-linking'
];

export const EnvironmentProvider = ({ children }: { children: ReactNode }) => {
  // Detect environment based on URL and params
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  
  // Force beta mode via URL param or env var
  const forceBeta = searchParams.has('beta') || 
                   (typeof process !== 'undefined' && process.env.VITE_FORCE_BETA === '1');
  
  // Consider staging domains (.staging.yourdomain.com) as beta
  const isStagingDomain = hostname.includes('.staging.') || hostname.includes('-staging.');
  
  const isBetaMode = forceBeta || 
                    isStagingDomain ||
                    hostname.includes('lovable.app') || 
                    hostname.includes('localhost') || 
                    hostname.includes('127.0.0.1');
  
  const isLive = !isBetaMode;

  const canUseFeature = (feature: string): boolean => {
    // In beta mode, all features are available
    if (isBetaMode) return true;
    
    // In live mode, beta features are disabled
    return !BETA_FEATURES.includes(feature);
  };

  return (
    <EnvironmentContext.Provider value={{ isBetaMode, isLive, canUseFeature }}>
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