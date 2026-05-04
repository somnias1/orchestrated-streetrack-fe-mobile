import { hangoutHandlers } from '@/services/hangouts/__mocks__/hangout-handlers';
import { transactionHandlers } from '@/services/transactions/__mocks__/transaction-handlers';
import { dashboardHandlers } from '@/services/dashboard/__mocks__/dashboard-handlers';
import { subcategoryHandlers } from '@/services/subcategories/__mocks__/subcategory-handlers';

export const allHandlers = [
  ...hangoutHandlers,
  ...transactionHandlers,
  ...dashboardHandlers,
  ...subcategoryHandlers,
];
