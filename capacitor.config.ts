import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ledgeraai.android',
  appName: 'Ledgera AI',
  webDir: 'dist',
  server: {
    url: 'https://ledgera-ai684516.base44.app',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      '*.base44.app',
      'base44.app',
      'accounts.google.com',
      '*.google.com',
      'ledgera-ai684516.base44.app',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#ffffff',
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
