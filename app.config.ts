import type { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => ({
  name: 'Streetrack',
  slug: 'orchestrated-streetrack-fe-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  // Deep-link scheme locked by mobile-companion-scope (streetrack://callback)
  scheme: 'streetrack',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  icon: './assets/images/icon.png',
  android: {
    package: 'com.streetrack.mobile', // locked — cannot change after first Play upload
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-local-authentication',
    [
      'react-native-auth0',
      {
        domain: process.env.AUTH0_DOMAIN ?? '',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: { backgroundColor: '#000000' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    auth0Domain: process.env.AUTH0_DOMAIN,
    auth0ClientId: process.env.AUTH0_CLIENT_ID,
    auth0Audience: process.env.AUTH0_AUDIENCE,
    apiBaseUrl: process.env.API_BASE_URL,
    eas: {
      projectId: 'e038754f-7da1-4cc2-b850-638e3a82d73b',
    },
  },
});
