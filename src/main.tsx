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

// Run mobile initialization after a short delay to ensure React is ready
setTimeout(initMobile, 100);
