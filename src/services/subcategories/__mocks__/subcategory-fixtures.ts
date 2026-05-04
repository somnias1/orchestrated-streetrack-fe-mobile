import type { SubcategoryRead, GetSubcategoriesResponse } from '../types';

let _counter = 1;

export function makeSubcategory(overrides?: Partial<SubcategoryRead>): SubcategoryRead {
  const id = String(_counter++);
  return {
    id,
    category_id: 'cat-1',
    category_name: 'General',
    name: `Subcategory ${id}`,
    description: null,
    belongs_to_income: false,
    is_periodic: false,
    due_day: null,
    user_id: 'user-1',
    ...overrides,
  };
}

export function makeSubcategoryListPage(
  items: SubcategoryRead[],
  overrides?: Partial<GetSubcategoriesResponse>,
): GetSubcategoriesResponse {
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
