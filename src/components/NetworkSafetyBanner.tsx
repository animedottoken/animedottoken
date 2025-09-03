import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TestTube, Zap } from 'lucide-react';

interface NetworkSafetyBannerProps {
  showDismiss?: boolean;
}

export const NetworkSafetyBanner = ({ showDismiss = false }: NetworkSafetyBannerProps) => {
  return (
    <Alert className="border-primary/30 bg-primary/5 mb-6">
      <TestTube className="h-4 w-4 text-primary" />
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            DEVNET LIVE TESTING
          </Badge>
          <span className="text-sm text-muted-foreground">
            Real blockchain transactions on Solana Devnet
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-primary">
          <Zap className="w-3 h-3" />
          Live minting + Explorer links
        </div>
      </AlertDescription>
    </Alert>
  );
};