import { Alert, AlertDescription } from '@/components/ui/alert';
import { FlaskConical } from 'lucide-react';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useEffect, useRef } from 'react';

export const BetaBanner = () => {
  const { isLive } = useEnvironment();
  const bannerRef = useRef<HTMLDivElement>(null);

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
      className="fixed top-0 left-0 fixed-avoid-scrollbar z-[60]"
    >
      <Alert 
        className="w-full bg-warning text-warning-foreground border-0 rounded-none shadow-lg"
        role="banner"
        aria-live="polite"
      >
      <FlaskConical className="h-4 w-4 text-warning-foreground" />
      <div className="flex items-center w-full">
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-sm font-medium">
            <strong className="font-bold">🧪 You're early.</strong> ANIME.TOKEN is just starting its new era. This is your chance to get in on the ground floor. <strong className="font-bold">Be one of the first.</strong>
          </AlertDescription>
        </div>
      </div>
    </Alert>
    </div>
  );
};