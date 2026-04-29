/**
 * API path constants for dashboard (no leading slash; base URL from callbackApi).
 */

export const dashboardQueryKey = 'dashboard';
export const dashboardPath = 'dashboard/' as const;

export const dashboardPaths = {
  balance: `${dashboardPath}balance`,
  monthBalance: `${dashboardPath}month-balance`,
  duePeriodicExpenses: `${dashboardPath}due-periodic-expenses`,
} as const;
