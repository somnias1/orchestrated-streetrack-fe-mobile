/** Hangouts API — TECHSPEC §4.1, §4.2 */
import { authFetch } from '../http';
import { hangoutsPaths } from './constants';
import type { GetHangoutsResponse, HangoutsListParams } from './types';

export async function getHangouts(params: HangoutsListParams): Promise<GetHangoutsResponse> {
  const qs = new URLSearchParams();
  if (params.name !== undefined && params.name !== null) qs.set('name', params.name);
  if (params.skip !== undefined) qs.set('skip', String(params.skip));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  const res = await authFetch(`${hangoutsPaths.list}?${qs.toString()}`);
  return res.json();
}
