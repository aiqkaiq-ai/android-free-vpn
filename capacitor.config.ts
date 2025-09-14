import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b55a7265074c4834a2b006e126678aab',
  appName: 'SecureVPN',
  webDir: 'dist',
  server: {
    url: 'https://b55a7265-074c-4834-a2b0-06e126678aab.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#1a1f2e"
    }
  }
};

export default config;