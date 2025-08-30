import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wallet, Crown, X } from 'lucide-react';
import { truncateAddress } from '@/utils/addressUtils';

interface AutoPrimaryWalletPromptProps {
  walletAddress: string;
  onSetAsPrimary: () => Promise<boolean>;
  onDismiss: () => void;
}

export const AutoPrimaryWalletPrompt = ({ 
  walletAddress, 
  onSetAsPrimary, 
  onDismiss 
}: AutoPrimaryWalletPromptProps) => {
  const handleSetAsPrimary = async () => {
    const success = await onSetAsPrimary();
    // Component will be hidden automatically on success via parent state
  };

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-700">
      <Crown className="h-4 w-4" />
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Set Primary Wallet
          </AlertTitle>
          <AlertDescription className="mt-2">
            You have no primary wallet linked. Would you like to set your connected wallet{' '}
            <span className="font-mono font-medium">{truncateAddress(walletAddress)}</span>{' '}
            as your primary identity wallet?
          </AlertDescription>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSetAsPrimary} className="h-8">
              <Crown className="h-3 w-3 mr-1" />
              Set as Primary
            </Button>
            <Button variant="outline" size="sm" onClick={onDismiss} className="h-8">
              Maybe Later
            </Button>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="h-6 w-6 p-0 ml-2 opacity-70 hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Alert>
  );
};