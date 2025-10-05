import { createContext, useContext, ReactNode } from 'react';

// Simplified auth context - wallet-only, no email/password auth
interface AuthContextType {
  user: null;
  session: null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // No auth - wallet is the only identity
  const value = {
    user: null,
    session: null,
    loading: false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
