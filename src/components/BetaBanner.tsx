import { Alert, AlertDescription } from '@/components/ui/alert';
import { FlaskConical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const BetaBanner = () => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [dynamicVersion, setDynamicVersion] = useState('');

  // Generate dynamic version number - fully automated using year.month.day.hourminute
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setDynamicVersion(`${year}.${month}.${day}.${hours}${minutes}`);
  }, []);

  // Clear any existing localStorage keys that might cause issues
  useEffect(() => {
    try {
      localStorage.removeItem('lastSeenUpdate');
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
  }, []);

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
            <span className="font-bold">You're early. ANIME.TOKEN - Open Beta v{dynamicVersion}.</span> We&apos;re just starting, expect bugs. Your feedback is crucial for development.{' '}
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
      </div>
    </Alert>
    </div>
  );
};