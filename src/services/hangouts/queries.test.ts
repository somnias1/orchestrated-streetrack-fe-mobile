import { config } from '@/config';
import { todayISO } from '@/utils/format';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from '../../../__tests__/setup';
import { transactionsQueryKey } from '../transactions/constants';
import { makeHangout, makeHangoutListPage } from './__mocks__/hangout-fixtures';
import { hangoutsPaths, hangoutsQueryKey } from './constants';
import {
  useCreateHangout,
  useDeleteHangout,
  useHangout,
  useInfiniteHangouts,
  useUpdateHangout,
} from './queries';

const BASE = config.apiBaseUrl;

function makeWrapper(client?: QueryClient) {
  const qc = client ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useInfiniteHangouts', () => {
  it('fetches and returns pages with correct query key shape', async () => {
    const items = [makeHangout(), makeHangout()];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage(items))),
    );
    const { result } = renderHook(() => useInfiniteHangouts(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].items).toHaveLength(2);
  });

  it('uses correct query key', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([]))),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useInfiniteHangouts('search'), { wrapper: makeWrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey);
    expect(keys.some((k) => JSON.stringify(k).includes('search'))).toBe(true);
  });
});

describe('useHangout', () => {
  it('fetches a single hangout when id is provided', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get('h-42')}`, () => HttpResponse.json(makeHangout({ id: 'h-42' }))),
    );
    const { result } = renderHook(() => useHangout('h-42'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('h-42');
  });

  it('is disabled when id is empty', () => {
    const { result } = renderHook(() => useHangout(''), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('errors on 404', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get('missing')}`, () => HttpResponse.json({}, { status: 404 })),
    );
    const { result } = renderHook(
      () => useHangout('missing'),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as { status?: number })?.status).toBe(404);
  });
});

describe('useCreateHangout', () => {
  it('invalidates only hangoutsQueryKey on success', async () => {
    server.use(
      http.post(`${BASE}/${hangoutsPaths.list}`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json(makeHangout({ name: body.name as string }), { status: 201 });
      }),
    );
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateHangout(), { wrapper: makeWrapper(client) });
    await result.current.mutateAsync({ name: 'Test', date: todayISO() });
    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => c[0]);
    expect(invalidatedKeys.some((k) => JSON.stringify(k).includes(hangoutsQueryKey))).toBe(true);
    expect(invalidatedKeys.some((k) => JSON.stringify(k).includes(transactionsQueryKey))).toBe(false);
  });
});

describe('useUpdateHangout', () => {
  it('invalidates both hangoutsQueryKey and transactionsQueryKey on success', async () => {
    server.use(
      http.patch(`${BASE}/${hangoutsPaths.update('h-1')}`, async () => HttpResponse.json(makeHangout({ id: 'h-1' }))),
    );
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateHangout(), { wrapper: makeWrapper(client) });
    await result.current.mutateAsync({ id: 'h-1', body: { name: 'Renamed' } });
    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => c[0]);
    expect(invalidatedKeys.some((k) => JSON.stringify(k).includes(hangoutsQueryKey))).toBe(true);
    expect(invalidatedKeys.some((k) => JSON.stringify(k).includes(transactionsQueryKey))).toBe(true);
  });
});

describe('useDeleteHangout', () => {
  it('optimistically removes item and invalidates caches on success', async () => {
    const hangouts = [makeHangout({ id: 'del-1' }), makeHangout({ id: 'del-2' })];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage(hangouts))),
      http.delete(`${BASE}/${hangoutsPaths.delete('del-1')}`, () => new HttpResponse(null, { status: 204 })),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    // Populate cache first
    const { result: listResult } = renderHook(() => useInfiniteHangouts(), { wrapper: makeWrapper(client) });
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useDeleteHangout(), { wrapper: makeWrapper(client) });
    await result.current.mutateAsync('del-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back optimistic remove on 500 error', async () => {
    const items = [makeHangout({ id: 'rb-1' }), makeHangout({ id: 'rb-2' })];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage(items))),
      http.delete(`${BASE}/${hangoutsPaths.delete('rb-1')}`, () => HttpResponse.json({}, { status: 500 })),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result: listResult } = renderHook(() => useInfiniteHangouts(), { wrapper: makeWrapper(client) });
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useDeleteHangout(), { wrapper: makeWrapper(client) });
    await expect(result.current.mutateAsync('rb-1')).rejects.toBeDefined();
    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = client.getQueryData<{ pages: Array<{ items: Array<{ id: string }> }> }>(
      [hangoutsQueryKey, 'list', { name: undefined }],
    );
    expect(cached?.pages[0].items.some((h) => h.id === 'rb-1')).toBe(true);
  });
});
