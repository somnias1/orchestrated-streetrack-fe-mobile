import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { useAuthSession } from './useAuthSession';
import { SplashView } from './SplashView';

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuthSession();

  if (isLoading) return <SplashView />;
  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  return <>{children}</>;
}
