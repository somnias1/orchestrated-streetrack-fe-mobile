export const config = {
  auth0Domain: 'test.auth0.com',
  auth0ClientId: 'test-client-id',
  auth0Audience: 'https://test-audience',
  apiBaseUrl: 'http://localhost:8000',
} as const;

export type Config = typeof config;
