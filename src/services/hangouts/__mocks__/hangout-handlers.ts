import { config } from '@/config';
import { http, HttpResponse } from 'msw';
import { hangoutsPaths } from '../constants';
import { makeHangout, makeHangoutListPage } from './hangout-fixtures';

const BASE = config.apiBaseUrl;

export const hangoutHandlers = [
  http.get(`${BASE}/${hangoutsPaths.list}`, () => {
    return HttpResponse.json(makeHangoutListPage([makeHangout(), makeHangout()]));
  }),

  http.get(`${BASE}/${hangoutsPaths.list}/:id/`, ({ params }) => {
    return HttpResponse.json(makeHangout({ id: params.id as string }));
  }),

  http.post(`${BASE}/${hangoutsPaths.list}`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(makeHangout({ name: body.name as string }), { status: 201 });
  }),

  http.patch(`${BASE}/${hangoutsPaths.list}/:id/`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(makeHangout({ id: params.id as string, ...body }));
  }),

  http.delete(`${BASE}/${hangoutsPaths.list}/:id/`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
