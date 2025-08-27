import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

interface SocialActionWrapperProps {
  children: React.ReactNode;
  action: string;
  onAction: () => void | Promise<void>;
  requireAuth?: boolean;
}

export default function SocialActionWrapper({ 
  children, 
  action, 
  onAction, 
  requireAuth = true 
}: SocialActionWrapperProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  const handleClick = async () => {
    if (requireAuth && !user) {
      setShowAuthModal(true);
      return;
    }

    try {
      await onAction();
    } catch (error) {
      console.error('Error performing social action:', error);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Try the action again after successful auth
    setTimeout(() => {
      onAction();
    }, 100);
  };

  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>
      
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title={`Sign in to ${action}`}
        description="Join the community to like NFTs, follow creators, and more"
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}