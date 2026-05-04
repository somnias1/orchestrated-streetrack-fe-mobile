import { config } from '@/config';
import { http, HttpResponse } from 'msw';
import { dashboardPaths } from '../constants';
import { makeBalance, makeDuePeriodicExpense, makeMonthBalance } from './dashboard-fixtures';

const BASE = config.apiBaseUrl;

export const dashboardHandlers = [
  http.get(`${BASE}/${dashboardPaths.balance}`, () => {
    return HttpResponse.json(makeBalance());
  }),

  http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => {
    return HttpResponse.json(makeMonthBalance());
  }),

  http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => {
    return HttpResponse.json([makeDuePeriodicExpense(), makeDuePeriodicExpense({ paid: true, subcategory_name: 'Netflix' })]);
  }),
];
