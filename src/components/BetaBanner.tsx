import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FlaskConical, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEnvironment } from '@/contexts/EnvironmentContext';

const STORAGE_KEY = 'beta-banner-dismissed';

export const BetaBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const { isLive } = useEnvironment();

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Show on BOTH live and beta unless dismissed
  if (dismissed) return null;

  return (
    <>
      {/* Spacer to prevent content overlap when banner is fixed */}
      <div className="h-16 sm:h-20 w-full" aria-hidden="true" />
      
      <Alert 
        className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground border-0 rounded-none shadow-lg animate-in slide-in-from-top duration-300"
        role="banner"
        aria-live="polite"
      >
        <FlaskConical className="h-4 w-4 text-warning-foreground" />
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-sm font-medium">
              <strong className="font-bold">🧪 You're early.</strong> ANIME.TOKEN is just starting its new era. This is your chance to get in on the ground floor. Be one of the first.
            </AlertDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="h-8 w-8 p-0 ml-4 hover:bg-warning/20 focus:bg-warning/20 text-warning-foreground shrink-0"
            aria-label="Dismiss beta banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </>
  );
};