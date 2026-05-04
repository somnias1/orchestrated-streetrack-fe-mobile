import { currentYearMonth } from '@/utils/format';
import { useQuery } from '@tanstack/react-query';
import { getBalance, getDuePeriodicExpenses, getMonthBalance } from './api';
import { dashboardQueryKey } from './constants';

export function useBalance() {
  return useQuery({
    queryKey: [dashboardQueryKey, 'balance'],
    queryFn: getBalance,
  });
}

export function useMonthBalance(year?: number, month?: number) {
  const { year: cy, month: cm } = currentYearMonth();
  const y = year ?? cy;
  const m = month ?? cm;
  return useQuery({
    queryKey: [dashboardQueryKey, 'monthBalance', y, m],
    queryFn: () => getMonthBalance(y, m),
  });
}

export function useDuePeriodicExpenses(year?: number, month?: number) {
  const { year: cy, month: cm } = currentYearMonth();
  const y = year ?? cy;
  const m = month ?? cm;
  return useQuery({
    queryKey: [dashboardQueryKey, 'duePeriodicExpenses', y, m],
    queryFn: () => getDuePeriodicExpenses(y, m),
  });
}
