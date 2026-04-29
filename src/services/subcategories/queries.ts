/** Subcategories React Query hooks — TECHSPEC §2.2, §7.7 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { PICKER_PAGE_LIMIT } from '../types';
import { getSubcategories } from './api';
import { subcategoriesQueryKey } from './constants';

export function useSubcategoriesPicker(name?: string) {
  return useInfiniteQuery({
    queryKey: [subcategoriesQueryKey, 'picker', { name }],
    queryFn: ({ pageParam }) =>
      getSubcategories({ name: name ?? undefined, skip: pageParam as number, limit: PICKER_PAGE_LIMIT }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_skip : undefined),
  });
}
