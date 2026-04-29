import { Auth0Provider, useAuth0 } from 'react-native-auth0';
import { initAuthFetch } from '@/services/http';
import { config } from '@/config';
import { useEffect, type ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider domain={config.auth0Domain} clientId={config.auth0ClientId}>
      <AuthFetchBridge>{children}</AuthFetchBridge>
    </Auth0Provider>
  );
}

/** Wires the Auth0 credentials getter into authFetch once the provider is mounted. */
function AuthFetchBridge({ children }: { children: ReactNode }) {
  const { getCredentials } = useAuth0();

  useEffect(() => {
    initAuthFetch(async () => {
      const creds = await getCredentials();
      if (!creds?.accessToken) throw new Error('[AuthFetchBridge] No access token');
      return creds.accessToken;
    });
  }, [getCredentials]);

  return <>{children}</>;
}
