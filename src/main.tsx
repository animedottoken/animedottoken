import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Capacitor imports for mobile app
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

// Initialize native mobile features
const initMobile = async () => {
  if (Capacitor.isNativePlatform()) {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#8B5CF6' });
    
    // Hide splash screen after app loads
    await SplashScreen.hide();
  }
};

createRoot(document.getElementById("root")!).render(<App />);

// Initialize mobile features after React renders
initMobile();
