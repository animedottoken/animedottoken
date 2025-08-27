import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthenticatedActionOptions {
  onSuccess?: () => void;
  requireAuth?: boolean;
}

export function useAuthenticatedAction(options: UseAuthenticatedActionOptions = {}) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const { onSuccess, requireAuth = true } = options;

  const executeAction = (action: () => void | Promise<void>) => {
    if (requireAuth && !user) {
      setShowAuthModal(true);
      return;
    }

    if (typeof action === 'function') {
      const result = action();
      if (result instanceof Promise) {
        result.then(() => {
          onSuccess?.();
        });
      } else {
        onSuccess?.();
      }
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onSuccess?.();
  };

  return {
    executeAction,
    showAuthModal,
    setShowAuthModal,
    handleAuthSuccess,
    isAuthenticated: !!user,
  };
}