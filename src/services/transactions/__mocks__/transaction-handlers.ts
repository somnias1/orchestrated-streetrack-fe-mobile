import { config } from '@/config';
import { http, HttpResponse } from 'msw';
import { transactionsPaths } from '../constants';
import { makeTransaction, makeTransactionListPage } from './transaction-fixtures';

const BASE = config.apiBaseUrl;

export const transactionHandlers = [
  http.get(`${BASE}/${transactionsPaths.list}`, () => {
    return HttpResponse.json(makeTransactionListPage([makeTransaction(), makeTransaction()]));
  }),

  http.get(`${BASE}/${transactionsPaths.get(':id')}`, ({ params }) => {
    return HttpResponse.json(makeTransaction({ id: params.id as string }));
  }),

  http.post(`${BASE}/${transactionsPaths.list}`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      makeTransaction({ description: body.description as string }),
      { status: 201 },
    );
  }),

  http.patch(`${BASE}/${transactionsPaths.update(':id')}`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(makeTransaction({ id: params.id as string, ...body }));
  }),

  http.delete(`${BASE}/${transactionsPaths.delete(':id')}`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
