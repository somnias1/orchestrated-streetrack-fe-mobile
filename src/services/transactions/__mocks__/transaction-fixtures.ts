import { todayISO } from '@/utils/format';
import type { GetTransactionsResponse, TransactionRead } from '../types';

let _counter = 1;

export function makeTransaction(overrides?: Partial<TransactionRead>): TransactionRead {
  const id = String(_counter++);
  return {
    id,
    subcategory_id: 'sub-1',
    subcategory_name: 'Food',
    value: 100,
    description: `Transaction ${id}`,
    date: todayISO(),
    hangout_id: null,
    hangout_name: null,
    user_id: 'user-1',
    ...overrides,
  };
}

export function makeTransactionListPage(
  items: TransactionRead[],
  overrides?: Partial<GetTransactionsResponse>,
): GetTransactionsResponse {
  return {
    items,
    total: items.length,
    skip: 0,
    limit: 50,
    has_more: false,
    next_skip: items.length,
    ...overrides,
  };
}
