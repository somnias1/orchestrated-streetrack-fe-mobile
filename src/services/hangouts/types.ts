/**
 * Hangouts API types (TECHSPEC §4.1). Match backend OpenAPI schemas.
 */

import type { DefaultParams, PaginatedRead } from '../types';

export type HangoutRead = {
  id: string;
  name: string;
  description: string | null;
  date: string;
  user_id: string | null;
};

export type HangoutCreate = {
  name: string;
  date: string;
  description?: string | null;
};

export type HangoutUpdate = {
  name?: string | null;
  date?: string | null;
  description?: string | null;
};

/** GET /hangouts/ response */
export type GetHangoutsResponse = PaginatedRead<HangoutRead>;

export type HangoutsListParams = DefaultParams & {
  name?: string | null;
};
