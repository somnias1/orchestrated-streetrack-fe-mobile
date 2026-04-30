import { Redirect } from 'expo-router';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { SplashView } from '@/features/auth/SplashView';
import { useAuthSession } from '@/features/auth/useAuthSession';

export default function SignInRoute() {
  const { isLoading, isAuthenticated } = useAuthSession();

  if (isLoading) return <SplashView />;
  if (isAuthenticated) return <Redirect href="/(tabs)" />;
  return <SignInScreen />;
}
