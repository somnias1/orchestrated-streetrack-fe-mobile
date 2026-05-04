import { config } from '@/config';
import { todayISO } from '@/utils/format';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__tests__/setup';
import { ApiError } from '../errors';
import { makeHangout, makeHangoutListPage } from './__mocks__/hangout-fixtures';
import {
  createHangout,
  deleteHangout,
  getHangout,
  getHangouts,
  updateHangout,
} from './api';
import { hangoutsPaths } from './constants';

const BASE = config.apiBaseUrl;

describe('getHangouts', () => {
  it('returns paginated list', async () => {
    const items = [makeHangout(), makeHangout()];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage(items))),
    );
    const result = await getHangouts({});
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe(items[0].id);
  });

  it('sends name query param', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(makeHangoutListPage([]));
      }),
    );
    await getHangouts({ name: 'birthday' });
    expect(capturedUrl).toContain('name=birthday');
  });

  it('throws ApiError on non-2xx', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(getHangouts({})).rejects.toThrow(ApiError);
  });
});

describe('getHangout', () => {
  it('returns a single hangout', async () => {
    const hangout = makeHangout({ id: 'h-1', name: 'My Hangout' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get('h-1')}`, () => HttpResponse.json(hangout)),
    );
    const result = await getHangout('h-1');
    expect(result.id).toBe('h-1');
    expect(result.name).toBe('My Hangout');
  });

  it('throws ApiError on 404', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get('missing')}`, () => HttpResponse.json({}, { status: 404 })),
    );
    await expect(getHangout('missing')).rejects.toMatchObject({ status: 404 });
  });
});

describe('createHangout', () => {
  it('sends POST with body and returns created hangout', async () => {
    let receivedBody: unknown;
    server.use(
      http.post(`${BASE}/${hangoutsPaths.list}`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(makeHangout({ name: 'Party' }), { status: 201 });
      }),
    );
    const result = await createHangout({ name: 'Party', date: todayISO() });
    expect(receivedBody).toMatchObject({ name: 'Party', date: todayISO() });
    expect(result.name).toBe('Party');
  });

  it('throws ApiError on non-2xx', async () => {
    server.use(
      http.post(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json({}, { status: 422 })),
    );
    await expect(createHangout({ name: 'P', date: todayISO() })).rejects.toMatchObject({ status: 422 });
  });
});

describe('updateHangout', () => {
  it('sends PATCH with body and returns updated hangout', async () => {
    let receivedBody: unknown;
    server.use(
      http.patch(`${BASE}/${hangoutsPaths.get('h-1')}`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(makeHangout({ id: 'h-1', name: 'Renamed' }));
      }),
    );
    const result = await updateHangout('h-1', { name: 'Renamed' });
    expect(receivedBody).toMatchObject({ name: 'Renamed' });
    expect(result.name).toBe('Renamed');
  });

  it('throws ApiError on non-2xx', async () => {
    server.use(
      http.patch(`${BASE}/${hangoutsPaths.update('h-1')}`, () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(updateHangout('h-1', {})).rejects.toThrow(ApiError);
  });
});

describe('deleteHangout', () => {
  it('sends DELETE and resolves void', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(`${BASE}/${hangoutsPaths.delete('h-1')}`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(deleteHangout('h-1')).resolves.toBeUndefined();
    expect(deleteCalled).toBe(true);
  });

  it('throws ApiError on non-2xx', async () => {
    server.use(
      http.delete(`${BASE}/${hangoutsPaths.delete('h-1')}`, () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(deleteHangout('h-1')).rejects.toThrow(ApiError);
  });
});
