import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

interface PaymentWalletButtonProps {
  onPaymentComplete?: (txSignature: string) => void;
  disabled?: boolean;
  amount?: number;
  currency?: string;
  children?: React.ReactNode;
}

export const PaymentWalletButton = ({ 
  onPaymentComplete, 
  disabled, 
  amount, 
  currency = 'ANIME',
  children 
}: PaymentWalletButtonProps) => {
  const { connected, publicKey, connectPaymentWallet } = useSolanaWallet();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!connected) {
      await connectPaymentWallet();
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment transaction
      const demoTxSignature = `demo_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onPaymentComplete?.(demoTxSignature);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (connected && publicKey) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-primary" />
            <div>
              <div className="font-mono text-sm">
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </div>
              <div className="text-xs text-muted-foreground">Payment Wallet</div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Connected
          </Badge>
        </div>
        
        <Button 
          onClick={handlePayment}
          disabled={disabled || processing}
          className="w-full"
        >
          {processing ? (
            'Processing Payment...'
          ) : (
            children || `Pay ${amount ? `${amount} ${currency}` : ''}`
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          This payment won't change your linked identity wallet
        </p>
      </div>
    );
  }

  return (
    <Button 
      onClick={() => connectPaymentWallet()}
      disabled={disabled}
      variant="outline"
      className="w-full"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect Payment Wallet
    </Button>
  );
};