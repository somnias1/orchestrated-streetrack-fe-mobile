import { useCallback, useState } from 'react';
import { useAuth0, WebAuthError, WebAuthErrorCodes } from 'react-native-auth0';
import { config } from '@/config';

export function useAuthSession() {
  const { user, isLoading, authorize, clearSession } = useAuth0();
  const [error, setError] = useState<Error | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const signIn = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    try {
      await authorize({
        audience: config.auth0Audience,
        scope: 'openid profile email offline_access',
      });
    } catch (e) {
      if (
        e instanceof WebAuthError &&
        (e.type === WebAuthErrorCodes.USER_CANCELLED ||
          e.type === WebAuthErrorCodes.BROWSER_TERMINATED)
      ) {
        // user dismissed the browser — stay silent
      } else {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    } finally {
      setSigningIn(false);
    }
  }, [authorize]);

  const signOut = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  return {
    isLoading,
    signingIn,
    isAuthenticated: user !== null,
    user,
    error,
    signIn,
    signOut,
  };
}
