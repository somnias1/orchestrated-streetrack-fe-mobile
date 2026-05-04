import { todayISO } from '@/utils/format';
import type { GetHangoutsResponse, HangoutRead } from '../types';

let _counter = 1;

export function makeHangout(overrides?: Partial<HangoutRead>): HangoutRead {
  const id = String(_counter++);
  return {
    id,
    name: `Hangout ${id}`,
    description: null,
    date: todayISO(),
    user_id: 'user-1',
    ...overrides,
  };
}

export function makeHangoutListPage(
  items: HangoutRead[],
  overrides?: Partial<GetHangoutsResponse>,
): GetHangoutsResponse {
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
