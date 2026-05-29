import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.optik88.pos',
  appName: 'Optik88',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    allowNavigation: ['optik.codenusa.id']
  }
};

export default config;
