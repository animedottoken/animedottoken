import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Store current path and redirect to auth
      const currentPath = location.pathname + location.search + location.hash;
      console.log('RequireAuth: Storing redirect path before auth:', currentPath);
      
      try {
        sessionStorage.setItem('auth:redirect', currentPath);
      } catch (error) {
        console.warn('Failed to store redirect path:', error);
      }
      
      const returnTo = encodeURIComponent(currentPath);
      navigate(`/auth?redirect=${returnTo}`);
    }
  }, [user, loading, navigate, location]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
};