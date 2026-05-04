import type {
  DashboardBalanceRead,
  DashboardMonthBalanceRead,
  DashboardDuePeriodicExpenseRead,
} from '../types';

export function makeBalance(overrides?: Partial<DashboardBalanceRead>): DashboardBalanceRead {
  return { balance: 1500, ...overrides };
}

export function makeMonthBalance(overrides?: Partial<DashboardMonthBalanceRead>): DashboardMonthBalanceRead {
  return { balance: 300, year: 2026, month: 4, ...overrides };
}

export function makeDuePeriodicExpense(
  overrides?: Partial<DashboardDuePeriodicExpenseRead>,
): DashboardDuePeriodicExpenseRead {
  return {
    subcategory_id: 'sub-periodic-1',
    subcategory_name: 'Rent',
    category_id: 'cat-1',
    category_name: 'Housing',
    due_day: 30,
    paid: false,
    ...overrides,
  };
}
