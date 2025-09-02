import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

interface RememberWalletToggleProps {
  className?: string;
}

export const RememberWalletToggle = ({ className }: RememberWalletToggleProps) => {
  const { rememberWallet, setRememberWallet } = useSolanaWallet();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Switch
        id="remember-wallet"
        checked={rememberWallet}
        onCheckedChange={setRememberWallet}
      />
      <Label htmlFor="remember-wallet" className="text-sm">
        Remember this wallet connection
      </Label>
    </div>
  );
};