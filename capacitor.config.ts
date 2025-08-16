import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.073d74a699d542cc8d2e4144164f2d85',
  appName: 'animedottoken',
  webDir: 'dist',
  server: {
    url: "https://073d74a6-99d5-42cc-8d2e-4144164f2d85.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#8B5CF6",
      showSpinner: false
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#8B5CF6"
    }
  }
};

export default config;