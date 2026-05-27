import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.optik88.pos',
  appName: 'Optik88 POS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
