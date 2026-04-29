import { config } from '@/config';
import { ApiError } from './errors';

type GetAccessToken = () => Promise<string>;

let getAccessToken: GetAccessToken | null = null;

/** Called once by AuthProvider to wire in the Auth0 token getter. */
export function initAuthFetch(tokenGetter: GetAccessToken) {
  getAccessToken = tokenGetter;
}

/**
 * Authenticated fetch against streetrack-be.
 * All resource api.ts files MUST use this — never call fetch() directly.
 * TECHSPEC §4.2
 */
export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!getAccessToken) {
    throw new Error('[authFetch] Auth not initialised — call initAuthFetch first');
  }

  const token = await getAccessToken();
  const url = `${config.apiBaseUrl}/${path.replace(/^\//, '')}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    throw new ApiError(res.status, body);
  }

  return res;
}
