import { Alert, AlertDescription } from '@/components/ui/alert';
import { FlaskConical, X } from 'lucide-react';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CURRENT_UPDATE, UPDATE_MESSAGES } from '@/constants/updates';

export const BetaBanner = () => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has already seen this update with error handling
  useEffect(() => {
    try {
      const lastSeenUpdate = localStorage.getItem('lastSeenUpdate');
      if (lastSeenUpdate && parseInt(lastSeenUpdate) >= CURRENT_UPDATE) {
        setIsDismissed(true);
      }
    } catch (error) {
      console.warn('Error reading localStorage:', error);
      // Clear potentially corrupted localStorage and show banner
      try {
        localStorage.removeItem('lastSeenUpdate');
      } catch (clearError) {
        console.warn('Error clearing localStorage:', clearError);
      }
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem('lastSeenUpdate', CURRENT_UPDATE.toString());
      setIsDismissed(true);
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
      // Still dismiss the banner even if localStorage fails
      setIsDismissed(true);
    }
  };

  if (isDismissed) return null;

  useEffect(() => {
    const logBannerInfo = () => {
      if (bannerRef.current) {
        const computed = getComputedStyle(bannerRef.current);
        const scrollbarWidth = getComputedStyle(document.documentElement).getPropertyValue('--scrollbar-width');
        console.log(`[BetaBanner Debug] Width: ${bannerRef.current.offsetWidth}px, Right: ${computed.right}, --scrollbar-width: ${scrollbarWidth}`);
        console.log(`[BetaBanner Debug] Classes: ${bannerRef.current.className}`);
      }
    };
    
    setTimeout(logBannerInfo, 100);
    window.addEventListener('resize', logBannerInfo);
    return () => window.removeEventListener('resize', logBannerInfo);
  }, []);

  return (
    <div 
      ref={bannerRef}
      className="fixed top-0 left-0 fixed-avoid-scrollbar clip-avoid-scrollbar z-[60]"
    >
      <Alert 
        className="w-full bg-warning text-warning-foreground border-0 rounded-none shadow-lg"
        role="banner"
        aria-live="polite"
      >
      <div className="flex items-center w-full gap-3">
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-sm font-medium">
            <FlaskConical className="inline-block mr-2 h-4 w-4 text-warning-foreground" aria-hidden="true" /> 
            <span className="font-bold">ANIME.TOKEN - Open Beta v0.1.</span> We&apos;re just starting, expect bugs. Your feedback is crucial for development.{' '}
            <a 
              href="https://discord.com/invite/HmSJdT5MRX" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:no-underline font-semibold"
              aria-label="Join ANIME.TOKEN Discord server"
            >
              Join the community here.
            </a>
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 text-warning-foreground hover:bg-warning-foreground/10 shrink-0"
          aria-label="Dismiss update banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
    </div>
  );
};