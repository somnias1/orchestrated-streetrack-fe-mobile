import { config } from '@/config';
import { currentYearMonth, todayISO } from '@/utils/format';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from '../../../__tests__/setup';
import { dashboardQueryKey } from '../dashboard/constants';
import { makeTransaction, makeTransactionListPage } from './__mocks__/transaction-fixtures';
import { transactionsPaths, transactionsQueryKey } from './constants';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useInfiniteTransactions, useTransaction,
  useUpdateTransaction,
} from './queries';

const BASE = config.apiBaseUrl;

function makeWrapper(client?: QueryClient) {
  const qc = client ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useInfiniteTransactions', () => {
  it('fetches and returns pages', async () => {
    const items = [makeTransaction(), makeTransaction()];
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage(items))),
    );
    const { result } = renderHook(
      () => useInfiniteTransactions({ year: 2026, month: 4 }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].items).toHaveLength(2);
  });
});

describe('useTransaction', () => {
  it('fetches a single transaction when id is provided', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.get('tx-42')}`, () =>
        HttpResponse.json(makeTransaction({ id: 'tx-42' })),
      ),
    );
    const { result } = renderHook(() => useTransaction('tx-42'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('tx-42');
  });

  it('is disabled when id is empty', () => {
    const { result } = renderHook(() => useTransaction(''), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('errors on 404', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.get('missing')}`, () => HttpResponse.json({}, { status: 404 })),
    );
    const { result } = renderHook(() => useTransaction('missing'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateTransaction', () => {
  it('invalidates transactions and dashboard caches on success', async () => {
    server.use(
      http.post(`${BASE}/${transactionsPaths.list}`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json(makeTransaction({ description: body.description as string }), { status: 201 });
      }),
    );
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateTransaction(), { wrapper: makeWrapper(client) });
    await result.current.mutateAsync({
      subcategory_id: 'sub-1', value: 100, description: 'Test', date: todayISO(),
    });
    const keys = invalidateSpy.mock.calls.map((c) => JSON.stringify(c[0]));
    expect(keys.some((k) => k.includes(transactionsQueryKey))).toBe(true);
    expect(keys.some((k) => k.includes(dashboardQueryKey))).toBe(true);
  });
});

describe('useUpdateTransaction', () => {
  it('invalidates transactions and dashboard caches on success', async () => {
    server.use(
      http.patch(`${BASE}/${transactionsPaths.update('tx-1')}`, async () => HttpResponse.json(makeTransaction())),
    );
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateTransaction(), { wrapper: makeWrapper(client) });
    await result.current.mutateAsync({ id: 'tx-1', body: { description: 'Updated' } });
    const keys = invalidateSpy.mock.calls.map((c) => JSON.stringify(c[0]));
    expect(keys.some((k) => k.includes(transactionsQueryKey))).toBe(true);
    expect(keys.some((k) => k.includes(dashboardQueryKey))).toBe(true);
  });
});

describe('useDeleteTransaction', () => {
  it('optimistically removes item and invalidates on success', async () => {
    const items = [makeTransaction({ id: 'del-1' }), makeTransaction({ id: 'del-2' })];
    const now = currentYearMonth();
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage(items))),
      http.delete(`${BASE}/${transactionsPaths.delete('del-1')}`, () => new HttpResponse(null, { status: 204 })),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result: listResult } = renderHook(
      () => useInfiniteTransactions({ year: now.year, month: now.month }),
      { wrapper: makeWrapper(client) },
    );
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: makeWrapper(client) });
    await result.current.mutateAsync('del-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back optimistic remove on 500 error', async () => {
    const items = [makeTransaction({ id: 'rb-1' }), makeTransaction({ id: 'rb-2' })];
    const now = currentYearMonth();
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage(items))),
      http.delete(`${BASE}/${transactionsPaths.delete('rb-1')}`, () => HttpResponse.json({}, { status: 500 })),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result: listResult } = renderHook(
      () => useInfiniteTransactions({ year: now.year, month: now.month }),
      { wrapper: makeWrapper(client) },
    );
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: makeWrapper(client) });
    await expect(result.current.mutateAsync('rb-1')).rejects.toBeDefined();
    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = client.getQueryData<{ pages: Array<{ items: Array<{ id: string }> }> }>(
      [transactionsQueryKey, 'list', { year: now.year, month: now.month }],
    );
    expect(cached?.pages[0].items.some((t) => t.id === 'rb-1')).toBe(true);
  });
});
