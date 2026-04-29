export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`HTTP ${status}`);
    this.name = 'ApiError';
  }

  isUnauthorized() {
    return this.status === 401;
  }

  isValidation() {
    return this.status === 422;
  }

  isServer() {
    return this.status >= 500;
  }
}
