import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'sonner';

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
  const { connected, publicKey, connectPaymentWallet, connection, signTransaction } = useSolanaWallet();
  const [processing, setProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handlePayment = async () => {
    if (!connected || !publicKey) {
      await connectPaymentWallet();
      return;
    }

    setProcessing(true);
    try {
      // CRITICAL SECURITY: Create real Solana transaction
      const recipientPubkey = new PublicKey('7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8');
      const senderPubkey = new PublicKey(publicKey);
      const amountInLamports = Math.floor((amount || 0.1) * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderPubkey,
          toPubkey: recipientPubkey,
          lamports: amountInLamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPubkey;

      if (!signTransaction) {
        throw new Error('Wallet does not support signing transactions');
      }

      toast.info('Please approve the transaction in your wallet...');
      const signedTx = await signTransaction(transaction);
      
      toast.info('Transaction sent, waiting for confirmation...');
      const txSignature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txSignature, 'confirmed');
      
      setPaymentCompleted(true);
      toast.success('Payment completed successfully!');
      onPaymentComplete?.(txSignature);
    } catch (error: any) {
      console.error('Payment error:', error);
      
      if (error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('Insufficient')) {
        toast.error('Insufficient funds for transaction');
      } else {
        toast.error('Payment failed. Please try again.');
      }
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
          disabled={disabled || processing || paymentCompleted}
          className="w-full"
        >
          {processing ? (
            'Processing Payment...'
          ) : paymentCompleted ? (
            'Payment Confirmed ✓'
          ) : (
            children || `Pay ${amount ? `${amount} ${currency}` : ''}`
          )}
        </Button>
        
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