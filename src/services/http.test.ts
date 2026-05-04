import { config } from '@/config';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/setup';
import { ApiError } from './errors';
import { authFetch, initAuthFetch } from './http';

const BASE = config.apiBaseUrl;

beforeEach(() => {
  initAuthFetch(async () => 'test-token');
});

describe('authFetch', () => {
  it('attaches Bearer token', async () => {
    let receivedAuth: string | null = null;
    server.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        receivedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );
    await authFetch('ping');
    expect(receivedAuth).toBe('Bearer test-token');
  });

  it('sets Accept and Content-Type headers', async () => {
    let receivedAccept: string | null = null;
    let receivedContentType: string | null = null;
    server.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        receivedAccept = request.headers.get('Accept');
        receivedContentType = request.headers.get('Content-Type');
        return HttpResponse.json({ ok: true });
      }),
    );
    await authFetch('ping');
    expect(receivedAccept).toBe('application/json');
    expect(receivedContentType).toBe('application/json');
  });

  it('throws ApiError with status on non-2xx responses', async () => {
    server.use(
      http.get(`${BASE}/ping`, () => {
        return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
      }),
    );
    await expect(authFetch('ping')).rejects.toThrow(ApiError);
    await expect(authFetch('ping')).rejects.toMatchObject({ status: 404 });
  });

  it('throws ApiError on 500 responses', async () => {
    server.use(
      http.get(`${BASE}/ping`, () => {
        return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
      }),
    );
    await expect(authFetch('ping')).rejects.toMatchObject({ status: 500 });
  });

  it('throws if auth is not initialised', async () => {
    initAuthFetch(null as unknown as () => Promise<string>);
    await expect(authFetch('ping')).rejects.toThrow('[authFetch] Auth not initialised');
    initAuthFetch(async () => 'test-token');
  });
});
