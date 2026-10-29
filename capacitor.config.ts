import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.vercel.godfinger',
  appName: 'Godlight',
  webDir: 'mobile/www',
  backgroundColor: '#060817',
  server: {
    // The game uses server actions, auth, and cloud saves, so the native shell loads the deployed app.
    url: 'https://godlight.app',
    cleartext: false,
    errorPath: 'index.html',
  },
  ios: {
    contentInset: 'never',
    scrollEnabled: false,
    backgroundColor: '#060817',
  },
  android: {
    backgroundColor: '#060817',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#060817',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#060817',
      overlaysWebView: true,
    },
  },
}

export default config
