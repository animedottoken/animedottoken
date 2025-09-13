import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

interface UnifiedConnectButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  onConnect?: () => void;
}

export const UnifiedConnectButton = ({ 
  children,
  className,
  variant = 'default',
  size = 'default',
  disabled,
  onConnect
}: UnifiedConnectButtonProps) => {
  const { connected, connecting, connectPaymentWallet } = useSolanaWallet();

  const pendingOnConnect = useRef(false);

  useEffect(() => {
    if (connected && !connecting && pendingOnConnect.current) {
      pendingOnConnect.current = false;
      onConnect?.();
    }
  }, [connected, connecting, onConnect]);

  const handleClick = async () => {
    if (connected) {
      onConnect?.();
    } else {
      pendingOnConnect.current = true;
      await connectPaymentWallet();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || connecting}
      variant={variant}
      size={size}
      className={className}
    >
      <Wallet className="h-4 w-4 mr-2" />
      {connecting ? 'Connecting...' : 
       connected ? (children || 'Wallet Connected') : 
       (children || 'Connect Wallet')}
    </Button>
  );
};