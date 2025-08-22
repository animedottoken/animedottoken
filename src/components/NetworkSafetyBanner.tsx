import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TestTube, Zap } from 'lucide-react';

export const NetworkSafetyBanner = () => {
  return (
    <Alert className="border-success/30 bg-success/5 mb-6">
      <TestTube className="h-4 w-4 text-success" />
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            DEVNET TESTING MODE
          </Badge>
          <span className="text-sm text-muted-foreground">
            Zero cost testing - No real money spent
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-success">
          <Zap className="w-3 h-3" />
          Free SOL available for testing
        </div>
      </AlertDescription>
    </Alert>
  );
};