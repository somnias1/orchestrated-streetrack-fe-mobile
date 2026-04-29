/** Transactions API — TECHSPEC §4.1, §4.2 */
import { authFetch } from '../http';
import { transactionsPaths } from './constants';
import type { GetTransactionsResponse, TransactionCreate, TransactionRead, TransactionsListParams } from './types';

export async function getTransactions(params: TransactionsListParams): Promise<GetTransactionsResponse> {
  const qs = new URLSearchParams();
  if (params.year !== undefined) qs.set('year', String(params.year));
  if (params.month !== undefined) qs.set('month', String(params.month));
  if (params.day !== undefined) qs.set('day', String(params.day));
  if (params.subcategory_id !== undefined) qs.set('subcategory_id', params.subcategory_id);
  if (params.hangout_id !== undefined) qs.set('hangout_id', params.hangout_id);
  if (params.skip !== undefined) qs.set('skip', String(params.skip));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  const res = await authFetch(`${transactionsPaths.list}?${qs.toString()}`);
  return res.json();
}

export async function createTransaction(body: TransactionCreate): Promise<TransactionRead> {
  const res = await authFetch(transactionsPaths.list, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.json();
}
