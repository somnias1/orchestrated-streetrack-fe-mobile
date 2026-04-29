import { useQuery } from '@tanstack/react-query';
import { dashboardQueryKey } from './constants';
import { getBalance, getDuePeriodicExpenses, getMonthBalance } from './api';

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

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
