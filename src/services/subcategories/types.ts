/**
 * Subcategories API types (TECHSPEC §4.1). Match backend OpenAPI schemas.
 */

import type { DefaultParams, PaginatedRead } from '../types';

export type SubcategoryRead = {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  description: string | null;
  belongs_to_income: boolean;
  is_periodic: boolean;
  due_day: number | null;
  user_id: string | null;
};

export type SubcategoryCreate = {
  category_id: string;
  name: string;
  description?: string | null;
  belongs_to_income?: boolean;
  is_periodic?: boolean;
  due_day?: number | null;
};

export type SubcategoryUpdate = {
  category_id?: string | null;
  name?: string | null;
  description?: string | null;
  belongs_to_income?: boolean | null;
  is_periodic?: boolean | null;
  due_day?: number | null;
};

export type SubcategoriesListParams = DefaultParams & {
  belongs_to_income?: boolean;
  category_id?: string;
  name?: string | null;
};

/** GET /subcategories/ response */
export type GetSubcategoriesResponse = PaginatedRead<SubcategoryRead>;
