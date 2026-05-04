import { config } from '@/config';
import { todayISO } from '@/utils/format';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__tests__/setup';
import { ApiError } from '../errors';
import { makeTransaction, makeTransactionListPage } from './__mocks__/transaction-fixtures';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
} from './api';
import { transactionsPaths } from './constants';

const BASE = config.apiBaseUrl;

describe('getTransactions', () => {
  it('returns paginated list', async () => {
    const items = [makeTransaction(), makeTransaction()];
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage(items))),
    );
    const result = await getTransactions({ year: 2026, month: 4 });
    expect(result.items).toHaveLength(2);
  });

  it('sends year and month query params', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(makeTransactionListPage([]));
      }),
    );
    await getTransactions({ year: 2026, month: 4 });
    expect(capturedUrl).toContain('year=2026');
    expect(capturedUrl).toContain('month=4');
  });

  it('throws ApiError on non-2xx', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(getTransactions({})).rejects.toThrow(ApiError);
  });
});

describe('getTransaction', () => {
  it('returns a single transaction', async () => {
    const tx = makeTransaction({ id: 'tx-1', description: 'Lunch' });
    server.use(
      http.get(`${BASE}/${transactionsPaths.get('tx-1')}`, () => HttpResponse.json(tx)),
    );
    const result = await getTransaction('tx-1');
    expect(result.id).toBe('tx-1');
    expect(result.description).toBe('Lunch');
  });

  it('throws ApiError on 404', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.get('missing')}`, () => HttpResponse.json({}, { status: 404 })),
    );
    await expect(getTransaction('missing')).rejects.toMatchObject({ status: 404 });
  });
});

describe('createTransaction', () => {
  it('sends POST with body and returns created transaction', async () => {
    let receivedBody: unknown;
    server.use(
      http.post(`${BASE}/${transactionsPaths.list}`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(makeTransaction({ description: 'Coffee' }), { status: 201 });
      }),
    );
    const result = await createTransaction({
      subcategory_id: 'sub-1',
      value: 50,
      description: 'Coffee',
      date: todayISO(),
    });
    expect(receivedBody).toMatchObject({ description: 'Coffee', value: 50 });
    expect(result.description).toBe('Coffee');
  });

  it('throws ApiError on non-2xx', async () => {
    server.use(
      http.post(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json({}, { status: 422 })),
    );
    await expect(
      createTransaction({ subcategory_id: 's', value: 0, description: 'd', date: todayISO() }),
    ).rejects.toMatchObject({ status: 422 });
  });
});

describe('updateTransaction', () => {
  it('sends PATCH with body and returns updated transaction', async () => {
    let receivedBody: unknown;
    server.use(
      http.patch(`${BASE}/${transactionsPaths.update('tx-1')}`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(makeTransaction({ id: 'tx-1', description: 'Updated' }));
      }),
    );
    const result = await updateTransaction('tx-1', { description: 'Updated' });
    expect(receivedBody).toMatchObject({ description: 'Updated' });
    expect(result.description).toBe('Updated');
  });

  it('throws ApiError on non-2xx', async () => {
    server.use(
      http.patch(`${BASE}/${transactionsPaths.update('tx-1')}`, () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(updateTransaction('tx-1', {})).rejects.toThrow(ApiError);
  });
});

describe('deleteTransaction', () => {
  it('sends DELETE and resolves void', async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/${transactionsPaths.delete('tx-1')}`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(deleteTransaction('tx-1')).resolves.toBeUndefined();
    expect(called).toBe(true);
  });

  it('throws ApiError on non-2xx', async () => {
    server.use(
      http.delete(`${BASE}/${transactionsPaths.delete('tx-1')}`, () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(deleteTransaction('tx-1')).rejects.toThrow(ApiError);
  });
});
