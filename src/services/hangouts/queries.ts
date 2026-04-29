/** Hangouts React Query hooks — TECHSPEC §2.2, §7.8 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { PICKER_PAGE_LIMIT } from '../types';
import { getHangouts } from './api';
import { hangoutsQueryKey } from './constants';

export function useHangoutsPicker(name?: string) {
  return useInfiniteQuery({
    queryKey: [hangoutsQueryKey, 'picker', { name }],
    queryFn: ({ pageParam }) =>
      getHangouts({ name: name ?? undefined, skip: pageParam as number, limit: PICKER_PAGE_LIMIT }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_skip : undefined),
  });
}
