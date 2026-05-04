import { config } from '@/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from '../../../__tests__/setup';
import { makeSubcategory, makeSubcategoryListPage } from './__mocks__/subcategory-fixtures';
import { subcategoriesPaths } from './constants';
import { useSubcategoriesPicker } from './queries';

const BASE = config.apiBaseUrl;

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe('useSubcategoriesPicker', () => {
  it('fetches first page of subcategories', async () => {
    const items = [makeSubcategory(), makeSubcategory()];
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () => HttpResponse.json(makeSubcategoryListPage(items))),
    );
    const { result } = renderHook(() => useSubcategoriesPicker(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].items).toHaveLength(2);
  });

  it('sends name search param when provided', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(makeSubcategoryListPage([]));
      }),
    );
    const { result } = renderHook(() => useSubcategoriesPicker('food'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('name=food');
  });

  it('has a fetchNextPage function for infinite scroll', async () => {
    const firstPage = makeSubcategoryListPage(
      [makeSubcategory()],
      { has_more: true, next_skip: 50 },
    );
    const secondPage = makeSubcategoryListPage([makeSubcategory()], { skip: 50 });
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, ({ request }) => {
        const url = new URL(request.url);
        const skip = parseInt(url.searchParams.get('skip') ?? '0');
        return HttpResponse.json(skip === 0 ? firstPage : secondPage);
      }),
    );
    const { result } = renderHook(() => useSubcategoriesPicker(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
  });
});
