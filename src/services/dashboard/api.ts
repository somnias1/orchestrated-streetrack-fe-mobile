import { authFetch } from '@/services/http';
import { dashboardPaths } from './constants';
import type {
  DashboardBalanceRead,
  DashboardMonthBalanceRead,
  GetDashboardDuePeriodicExpensesResponse,
} from './types';

export async function getBalance(): Promise<DashboardBalanceRead> {
  const res = await authFetch(dashboardPaths.balance);
  return res.json();
}

export async function getMonthBalance(
  year: number,
  month: number,
): Promise<DashboardMonthBalanceRead> {
  const res = await authFetch(`${dashboardPaths.monthBalance}?year=${year}&month=${month}`);
  return res.json();
}

export async function getDuePeriodicExpenses(
  year: number,
  month: number,
): Promise<GetDashboardDuePeriodicExpensesResponse> {
  const res = await authFetch(
    `${dashboardPaths.duePeriodicExpenses}?year=${year}&month=${month}`,
  );
  return res.json();
}
