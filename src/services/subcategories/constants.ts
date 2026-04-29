/**
 * API path constants for subcategories (no leading slash; base URL from callbackApi).
 */
export const subcategoriesQueryKey = 'subcategories';
export const subcategoriesPath = 'subcategories/' as const;
export const subcategoriesPaths = {
  list: subcategoriesPath,
  get: (id: string) => `${subcategoriesPath}${id}/`,
  update: (id: string) => `${subcategoriesPath}${id}/`,
  delete: (id: string) => `${subcategoriesPath}${id}`,
} as const;
