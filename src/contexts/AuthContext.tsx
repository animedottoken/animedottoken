import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signOutFromAllDevices: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔐 Auth event: ${event}`, { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userEmail: session?.user?.email 
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Do not auto-redirect here; navigation is handled by the Auth page using ?redirect
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear any remember preferences
    localStorage.removeItem('remember-session');
    localStorage.removeItem('remember-wallet');
    navigate('/auth');
  };

  const signOutFromAllDevices = async () => {
    try {
      // Sign out locally first
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.removeItem('remember-session');
      localStorage.removeItem('remember-wallet');
      
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out from all devices:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    signOutFromAllDevices,
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