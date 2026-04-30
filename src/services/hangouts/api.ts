/** Hangouts API — TECHSPEC §4.1, §4.2 */
import { authFetch } from '../http';
import { hangoutsPaths } from './constants';
import type { GetHangoutsResponse, HangoutCreate, HangoutRead, HangoutUpdate, HangoutsListParams } from './types';

export async function getHangouts(params: HangoutsListParams): Promise<GetHangoutsResponse> {
  const qs = new URLSearchParams();
  if (params.name !== undefined && params.name !== null) qs.set('name', params.name);
  if (params.skip !== undefined) qs.set('skip', String(params.skip));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  const res = await authFetch(`${hangoutsPaths.list}?${qs.toString()}`);
  return res.json();
}

export async function getHangout(id: string): Promise<HangoutRead> {
  const res = await authFetch(hangoutsPaths.get(id));
  return res.json();
}

export async function createHangout(body: HangoutCreate): Promise<HangoutRead> {
  const res = await authFetch(hangoutsPaths.list, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function updateHangout(id: string, body: HangoutUpdate): Promise<HangoutRead> {
  const res = await authFetch(hangoutsPaths.update(id), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function deleteHangout(id: string): Promise<void> {
  await authFetch(hangoutsPaths.delete(id), { method: 'DELETE' });
}
