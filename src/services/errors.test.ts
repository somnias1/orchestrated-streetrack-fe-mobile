import { ApiError } from './errors';

describe('ApiError', () => {
  it('stores status, body, and sets name', () => {
    const err = new ApiError(404, { detail: 'not found' });
    expect(err.status).toBe(404);
    expect(err.body).toEqual({ detail: 'not found' });
    expect(err.message).toBe('HTTP 404');
    expect(err.name).toBe('ApiError');
    expect(err).toBeInstanceOf(Error);
  });

  it('isUnauthorized returns true only for 401', () => {
    expect(new ApiError(401, null).isUnauthorized()).toBe(true);
    expect(new ApiError(403, null).isUnauthorized()).toBe(false);
    expect(new ApiError(500, null).isUnauthorized()).toBe(false);
  });

  it('isValidation returns true only for 422', () => {
    expect(new ApiError(422, null).isValidation()).toBe(true);
    expect(new ApiError(400, null).isValidation()).toBe(false);
    expect(new ApiError(404, null).isValidation()).toBe(false);
  });

  it('isServer returns true for 5xx, false otherwise', () => {
    expect(new ApiError(500, null).isServer()).toBe(true);
    expect(new ApiError(503, null).isServer()).toBe(true);
    expect(new ApiError(404, null).isServer()).toBe(false);
    expect(new ApiError(422, null).isServer()).toBe(false);
  });
});
