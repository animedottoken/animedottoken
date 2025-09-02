import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionSecurityOptions {
  inactivityTimeoutMinutes?: number;
  rememberSession?: boolean;
}

export function useSessionSecurity(options: SessionSecurityOptions = {}) {
  const { 
    inactivityTimeoutMinutes = 30, 
    rememberSession: defaultRemember = false 
  } = options;
  
  const { user, signOut } = useAuth();
  const { disconnect } = useSolanaWallet();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [rememberSession, setRememberSession] = useState(() => {
    return localStorage.getItem('remember-session') === 'true' || defaultRemember;
  });

  // Track user activity
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);

  // Inactivity timeout
  useEffect(() => {
    if (!user || rememberSession) return;

    const checkInactivity = () => {
      const now = Date.now();
      const timeoutMs = inactivityTimeoutMinutes * 60 * 1000;
      
      if (now - lastActivity > timeoutMs) {
        toast.info('Session expired due to inactivity');
        handleSecureSignOut();
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, lastActivity, inactivityTimeoutMinutes, rememberSession]);

  const handleSecureSignOut = useCallback(async () => {
    // Sign out from auth
    await signOut();
    // Disconnect wallet
    disconnect();
    // Clear any sensitive data from localStorage
    localStorage.removeItem('remember-session');
    localStorage.removeItem('remember-wallet');
  }, [signOut, disconnect]);

  const signOutFromAllDevices = useCallback(async () => {
    try {
      // This would typically involve a backend call to invalidate all sessions
      // For now, we'll just sign out locally and show a message
      await handleSecureSignOut();
      toast.success('Signed out from this device. Other devices will be signed out on next activity.');
    } catch (error) {
      console.error('Error during global sign out:', error);
      toast.error('Failed to sign out from all devices');
    }
  }, [handleSecureSignOut]);

  const handleRememberSessionChange = useCallback((remember: boolean) => {
    setRememberSession(remember);
    if (remember) {
      localStorage.setItem('remember-session', 'true');
    } else {
      localStorage.removeItem('remember-session');
    }
  }, []);

  const requireStepUpAuth = useCallback(async (action: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // For sensitive actions, require recent authentication
      const lastSignIn = user.last_sign_in_at;
      const now = new Date();
      const timeSinceSignIn = now.getTime() - new Date(lastSignIn || 0).getTime();
      const thirtyMinutes = 30 * 60 * 1000;

      if (timeSinceSignIn > thirtyMinutes) {
        toast.error(`This action requires recent authentication. Please sign in again to ${action}.`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Step-up auth error:', error);
      return false;
    }
  }, [user]);

  return {
    rememberSession,
    setRememberSession: handleRememberSessionChange,
    signOutFromAllDevices,
    requireStepUpAuth,
    secureSignOut: handleSecureSignOut,
    lastActivity: new Date(lastActivity),
  };
}