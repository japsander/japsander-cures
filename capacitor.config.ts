import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.curestracker.app',
  appName: 'Cures Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;