/**
 * Transactions API types (TECHSPEC §4.1). Match backend OpenAPI schemas.
 */

import type { DefaultParams, PaginatedRead } from '../types';

export type TransactionRead = {
  id: string;
  subcategory_id: string;
  subcategory_name: string;
  value: number;
  description: string;
  date: string;
  hangout_id: string | null;
  hangout_name: string | null;
  user_id: string | null;
};

export type TransactionCreate = {
  subcategory_id: string;
  value: number;
  description: string;
  date: string;
  hangout_id?: string | null;
};

export type TransactionUpdate = {
  subcategory_id?: string | null;
  value?: number | null;
  description?: string | null;
  date?: string | null;
  hangout_id?: string | null;
};

export type TransactionsListParams = DefaultParams & {
  year?: number;
  month?: number;
  day?: number;
  subcategory_id?: string;
  hangout_id?: string;
};

/** GET /transactions/ response */
export type GetTransactionsResponse = PaginatedRead<TransactionRead>;

/** POST /transactions/bulk request body (OpenAPI TransactionBulkCreate) */
export type TransactionBulkCreate = {
  transactions: TransactionCreate[];
};

/** POST /transactions/bulk response (201) */
export type BulkCreateTransactionsResponse = TransactionRead[];
