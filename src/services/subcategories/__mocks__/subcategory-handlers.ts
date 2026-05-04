import { config } from '@/config';
import { http, HttpResponse } from 'msw';
import { subcategoriesPaths } from '../constants';
import { makeSubcategory, makeSubcategoryListPage } from './subcategory-fixtures';

const BASE = config.apiBaseUrl;

export const subcategoryHandlers = [
  http.get(`${BASE}/${subcategoriesPaths.list}`, () => {
    return HttpResponse.json(makeSubcategoryListPage([makeSubcategory(), makeSubcategory()]));
  }),
];
