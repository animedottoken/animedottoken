import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FlaskConical, ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import { useEnvironment } from '@/contexts/EnvironmentContext';

export const BetaBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const { isBetaMode } = useEnvironment();

  if (!isBetaMode || dismissed) return null;

  return (
    <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-200 mb-4">
      <FlaskConical className="h-4 w-4" />
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <AlertDescription className="text-sm">
            <strong>🧪 BETA/DEVELOPMENT SITE</strong> - You're viewing our test environment. 
            <Button 
              variant="link" 
              size="sm" 
              className="text-amber-200 underline p-0 ml-1 h-auto"
              onClick={() => window.open('https://animedottoken.com', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Visit Live Version
            </Button>
          </AlertDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setDismissed(true)}
          className="h-6 w-6 p-0 ml-2 opacity-70 hover:opacity-100 text-amber-200"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Alert>
  );
};