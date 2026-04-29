/**
 * API path constants for hangouts (no leading slash; base URL from callbackApi).
 */
export const hangoutsQueryKey = 'hangouts';

export const hangoutsPath = 'hangouts/' as const;

export const hangoutsPaths = {
  list: hangoutsPath,
  get: (id: string) => `${hangoutsPath}${id}/`,
  update: (id: string) => `${hangoutsPath}${id}/`,
  delete: (id: string) => `${hangoutsPath}${id}/`,
} as const;
