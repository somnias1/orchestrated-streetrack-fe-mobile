import '../global.css';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from 'hooks/use-color-scheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { BiometricGate } from '@/features/auth/BiometricGate';
import { queryClient } from '@/services/queryClient';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <BiometricGate>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <BottomSheetModalProvider>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="transaction-new" options={{ presentation: 'modal', headerShown: false }} />
                  </Stack>
                  <StatusBar style="auto" />
                </BottomSheetModalProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </BiometricGate>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
