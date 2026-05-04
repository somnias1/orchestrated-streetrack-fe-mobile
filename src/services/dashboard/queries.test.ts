import { config } from '@/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from '../../../__tests__/setup';
import { makeBalance, makeDuePeriodicExpense, makeMonthBalance } from './__mocks__/dashboard-fixtures';
import { dashboardPaths } from './constants';
import { useBalance, useDuePeriodicExpenses, useMonthBalance } from './queries';

const BASE = config.apiBaseUrl;

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe('useBalance', () => {
  it('returns balance and exposes refetch', async () => {
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json(makeBalance({ balance: 2500 }))),
    );
    const { result } = renderHook(() => useBalance(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.balance).toBe(2500);
    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('useMonthBalance', () => {
  it('returns month balance for given year/month', async () => {
    server.use(
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () =>
        HttpResponse.json(makeMonthBalance({ balance: 500, year: 2026, month: 4 })),
      ),
    );
    const { result } = renderHook(() => useMonthBalance(2026, 4), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.balance).toBe(500);
    expect(result.current.data?.year).toBe(2026);
  });

  it('uses current year/month when args omitted', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(makeMonthBalance());
      }),
    );
    const { result } = renderHook(() => useMonthBalance(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('year=');
    expect(capturedUrl).toContain('month=');
  });
});

describe('useDuePeriodicExpenses', () => {
  it('returns list of periodic expenses', async () => {
    const items = [
      makeDuePeriodicExpense({ paid: false }),
      makeDuePeriodicExpense({ paid: true, subcategory_name: 'Gym' }),
    ];
    server.use(
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json(items)),
    );
    const { result } = renderHook(() => useDuePeriodicExpenses(2026, 4), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.some((e) => e.paid === false)).toBe(true);
    expect(result.current.data?.some((e) => e.paid === true)).toBe(true);
    expect(typeof result.current.refetch).toBe('function');
  });
});
