/** Transactions React Query hooks — TECHSPEC §2.2, §7.4, §7.5, §7.6 */
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardQueryKey } from '../dashboard/constants';
import { DEFAULT_LIST_LIMIT } from '../types';
import { createTransaction, getTransactions } from './api';
import { transactionsQueryKey } from './constants';

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

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactionsAndDashboard();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: invalidate,
  });
}
