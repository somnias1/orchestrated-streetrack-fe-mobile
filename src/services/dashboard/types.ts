/**
 * Dashboard API types (TECHSPEC §4.1). Match backend OpenAPI schemas.
 */

/** GET /dashboard/balance — cumulative net balance (income − expense). Same unit as Transaction.value. */
export type DashboardBalanceRead = {
  balance: number;
};

/** GET /dashboard/month-balance?year=&month= — net balance for selected month. */
export type DashboardMonthBalanceRead = {
  balance: number;
  year: number;
  month: number;
};

/** One periodic subcategory with paid flag for selected month. GET /dashboard/due-periodic-expenses returns array. */
export type DashboardDuePeriodicExpenseRead = {
  subcategory_id: string;
  subcategory_name: string;
  category_id: string;
  category_name: string;
  due_day: number | null;
  paid: boolean;
};

/** GET /dashboard/due-periodic-expenses response */
export type GetDashboardDuePeriodicExpensesResponse =
  DashboardDuePeriodicExpenseRead[];
