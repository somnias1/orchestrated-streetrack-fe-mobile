/**
 * API path constants for transactions (no leading slash; base URL from callbackApi).
 */
export const transactionsQueryKey = 'transactions';
export const transactionsPath = 'transactions/' as const;
export const transactionsPaths = {
  list: transactionsPath,
  bulk: `${transactionsPath}bulk/` as const,
  get: (id: string) => `${transactionsPath}${id}/`,
  update: (id: string) => `${transactionsPath}${id}/`,
  delete: (id: string) => `${transactionsPath}${id}/`,
} as const;
