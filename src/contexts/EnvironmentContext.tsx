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
  // Detect environment based on URL
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isBetaMode = hostname.includes('lovable.app') || hostname.includes('localhost') || hostname.includes('127.0.0.1');
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