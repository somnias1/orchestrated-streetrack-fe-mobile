import { allHandlers } from './handlers';
import { setupServer } from 'msw/node';
import { initAuthFetch } from '@/services/http';

export const server = setupServer(...allHandlers);

// Wire a test token into authFetch for all test suites.
initAuthFetch(async () => 'test-token');

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
