/** Subcategories API — TECHSPEC §4.1, §4.2 */
import { authFetch } from '../http';
import { subcategoriesPaths } from './constants';
import type { GetSubcategoriesResponse, SubcategoriesListParams } from './types';

export async function getSubcategories(params: SubcategoriesListParams): Promise<GetSubcategoriesResponse> {
  const qs = new URLSearchParams();
  if (params.belongs_to_income !== undefined) qs.set('belongs_to_income', String(params.belongs_to_income));
  if (params.category_id !== undefined) qs.set('category_id', params.category_id);
  if (params.name !== undefined && params.name !== null) qs.set('name', params.name);
  if (params.skip !== undefined) qs.set('skip', String(params.skip));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  const res = await authFetch(`${subcategoriesPaths.list}?${qs.toString()}`);
  return res.json();
}
