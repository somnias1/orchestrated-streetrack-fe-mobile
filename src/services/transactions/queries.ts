/** Transactions React Query hooks — TECHSPEC §2.2, §7.4, §7.5, §7.6 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardQueryKey } from '../dashboard/constants';
import { DEFAULT_LIST_LIMIT } from '../types';
import { createTransaction, deleteTransaction, getTransaction, getTransactions, updateTransaction } from './api';
import { transactionsQueryKey } from './constants';
import type { TransactionUpdate } from './types';
import type { InfiniteData } from '@tanstack/react-query';
import type { GetTransactionsResponse } from './types';

function useInvalidateTransactionsAndDashboard() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [transactionsQueryKey] });
    queryClient.invalidateQueries({ queryKey: [dashboardQueryKey, 'balance'] });
    queryClient.invalidateQueries({ queryKey: [dashboardQueryKey, 'monthBalance'] });
    queryClient.invalidateQueries({ queryKey: [dashboardQueryKey, 'duePeriodicExpenses'] });
  };
}

export function useInfiniteTransactions({ year, month }: { year: number; month: number }) {
  return useInfiniteQuery({
    queryKey: [transactionsQueryKey, 'list', { year, month }],
    queryFn: ({ pageParam }) =>
      getTransactions({ year, month, skip: pageParam as number, limit: DEFAULT_LIST_LIMIT }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_skip : undefined),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: [transactionsQueryKey, 'detail', id],
    queryFn: () => getTransaction(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactionsAndDashboard();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactionsAndDashboard();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TransactionUpdate }) => updateTransaction(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTransactionsAndDashboard();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: [transactionsQueryKey] });
      const snapshots: Array<[readonly unknown[], InfiniteData<GetTransactionsResponse>]> = [];
      queryClient.getQueriesData<InfiniteData<GetTransactionsResponse>>({
        queryKey: [transactionsQueryKey, 'list'],
      }).forEach(([key, data]) => {
        if (data) {
          snapshots.push([key, data]);
          queryClient.setQueryData<InfiniteData<GetTransactionsResponse>>(key, {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.filter((t) => t.id !== id),
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
