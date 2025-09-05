import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FlaskConical, ExternalLink, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEnvironment } from '@/contexts/EnvironmentContext';

const STORAGE_KEY = 'beta-banner-dismissed';

export const BetaBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const { isBetaMode, isLive } = useEnvironment();

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
      <div className="h-16 w-full" aria-hidden="true" />
      
      <Alert 
        className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground border-0 rounded-none shadow-lg animate-in slide-in-from-top duration-300"
        role="banner"
        aria-live="polite"
      >
        <FlaskConical className="h-4 w-4 text-warning-foreground" />
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-sm font-medium">
              {isLive ? (
                <>
                  <strong className="font-bold">LIVE PRODUCTION SITE</strong> — Updates may take a few minutes to appear due to CDN and social caches.
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-warning-foreground underline p-0 ml-1 h-auto font-semibold hover:text-foreground/90"
                    onClick={() => window.open('https://animedottoken.lovable.app', '_blank')}
                    aria-label="Visit beta test site"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit Test Version
                  </Button>
                </>
              ) : (
                <>
                  <strong className="font-bold">🧪 BETA/DEVELOPMENT SITE</strong> — You're viewing our test environment.
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-warning-foreground underline p-0 ml-1 h-auto font-semibold hover:text-foreground/90"
                    onClick={() => window.open('https://animedottoken.com', '_blank')}
                    aria-label="Visit live production site"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit Live Version
                  </Button>
                </>
              )}
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