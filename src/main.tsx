import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize React app first
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Initialize mobile features after React is fully loaded
const initMobile = async () => {
  try {
    // Only import Capacitor modules if we're in a mobile environment
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      const { Capacitor } = await import('@capacitor/core');
      
      if (Capacitor.isNativePlatform()) {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        
        // Configure status bar
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#8B5CF6' });
        
        // Hide splash screen after app loads
        await SplashScreen.hide();
      }
    }
  } catch (error) {
    console.log('Mobile features not available:', error);
  }
};

// Compute and set CSS var for scrollbar width
const setScrollbarWidthVar = () => {
  try {
    const width = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--scrollbar-width', `${width}px`);
    console.log(`[Scrollbar Fix] Set --scrollbar-width to ${width}px (innerWidth: ${window.innerWidth}, clientWidth: ${document.documentElement.clientWidth})`);
  } catch (e) {
    console.error('[Scrollbar Fix] Error setting scrollbar width:', e);
  }
};

// Initialize and listen for changes
const initScrollbarWidthVar = () => {
  setScrollbarWidthVar();
  window.addEventListener('resize', setScrollbarWidthVar);
};

// Debug scrollbar behavior
const initScrollbarDebug = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target as HTMLElement;
        if (target.tagName === 'HTML' || target.tagName === 'BODY') {
          const style = target.getAttribute('style') || '';
          if (style.includes('overflow') || style.includes('padding-right')) {
            console.log(`[Scrollbar Debug] ${target.tagName} style changed:`, style);
          }
        }
      }
    });
  });
  
  observer.observe(document.documentElement, { attributes: true });
  observer.observe(document.body, { attributes: true });
};

// Run mobile initialization after a short delay to ensure React is ready
setTimeout(initMobile, 100);

// Initialize computed scrollbar width var ASAP
setTimeout(initScrollbarWidthVar, 0);

// Initialize scrollbar debugging
setTimeout(initScrollbarDebug, 200);
