/** Hangouts React Query hooks — TECHSPEC §2.2, §7.8 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_LIST_LIMIT, PICKER_PAGE_LIMIT } from '../types';
import { transactionsQueryKey } from '../transactions/constants';
import { createHangout, deleteHangout, getHangout, getHangouts, updateHangout } from './api';
import { hangoutsQueryKey } from './constants';
import type { InfiniteData } from '@tanstack/react-query';
import type { GetHangoutsResponse } from './types';
import type { HangoutUpdate } from './types';

export function useHangoutsPicker(name?: string) {
  return useInfiniteQuery({
    queryKey: [hangoutsQueryKey, 'picker', { name }],
    queryFn: ({ pageParam }) =>
      getHangouts({ name: name ?? undefined, skip: pageParam as number, limit: PICKER_PAGE_LIMIT }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_skip : undefined),
  });
}

export function useInfiniteHangouts(name?: string) {
  return useInfiniteQuery({
    queryKey: [hangoutsQueryKey, 'list', { name }],
    queryFn: ({ pageParam }) =>
      getHangouts({ name: name ?? undefined, skip: pageParam as number, limit: DEFAULT_LIST_LIMIT }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_skip : undefined),
  });
}

export function useHangout(id: string) {
  return useQuery({
    queryKey: [hangoutsQueryKey, 'detail', id],
    queryFn: () => getHangout(id),
    enabled: !!id,
  });
}

function useInvalidateHangoutsAndTransactions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [hangoutsQueryKey] });
    queryClient.invalidateQueries({ queryKey: [transactionsQueryKey] });
  };
}

export function useCreateHangout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHangout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [hangoutsQueryKey] });
    },
  });
}

export function useUpdateHangout() {
  const invalidate = useInvalidateHangoutsAndTransactions();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: HangoutUpdate }) => updateHangout(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteHangout() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateHangoutsAndTransactions();
  return useMutation({
    mutationFn: (id: string) => deleteHangout(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: [hangoutsQueryKey] });
      const snapshots: Array<[readonly unknown[], InfiniteData<GetHangoutsResponse>]> = [];
      queryClient.getQueriesData<InfiniteData<GetHangoutsResponse>>({
        queryKey: [hangoutsQueryKey, 'list'],
      }).forEach(([key, data]) => {
        if (data) {
          snapshots.push([key, data]);
          queryClient.setQueryData<InfiniteData<GetHangoutsResponse>>(key, {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.filter((h) => h.id !== id),
            })),
          });
        }
      });
      return { snapshots };
    },
    onError: (_err, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: invalidate,
  });
}
