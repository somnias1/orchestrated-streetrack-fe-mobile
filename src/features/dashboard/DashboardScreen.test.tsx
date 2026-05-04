import { config } from '@/config';
import {
  makeBalance,
  makeDuePeriodicExpense,
  makeMonthBalance,
} from '@/services/dashboard/__mocks__/dashboard-fixtures';
import { dashboardPaths } from '@/services/dashboard/constants';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { http, HttpResponse } from 'msw';
import React from 'react';
import DashboardScreen from '.';
import { server } from '../../../__tests__/setup';

const BASE = config.apiBaseUrl;

describe('DashboardScreen', () => {
  it('shows static section labels immediately', () => {
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json(makeBalance())),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => HttpResponse.json(makeMonthBalance())),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json([])),
    );
    renderWithProviders(<DashboardScreen />);
    expect(screen.getByText('Cumulative balance')).toBeTruthy();
    expect(screen.getByText('Month balance')).toBeTruthy();
  });

  it('displays signed balance value after load', async () => {
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json(makeBalance({ balance: 500 }))),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => HttpResponse.json(makeMonthBalance())),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json([])),
    );
    renderWithProviders(<DashboardScreen />);
    await waitFor(() => expect(screen.getByText('+500')).toBeTruthy());
  });

  it('shows Paid and Unpaid badges for periodic expenses', async () => {
    const items = [
      makeDuePeriodicExpense({ paid: true, subcategory_name: 'Netflix', subcategory_id: 'sub-1' }),
      makeDuePeriodicExpense({ paid: false, subcategory_name: 'Gym', subcategory_id: 'sub-2' }),
    ];
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json(makeBalance())),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => HttpResponse.json(makeMonthBalance())),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json(items)),
    );
    renderWithProviders(<DashboardScreen />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeTruthy());
    expect(screen.getByText('Gym')).toBeTruthy();
    expect(screen.getByText('Paid')).toBeTruthy();
    expect(screen.getByText('Unpaid')).toBeTruthy();
  });

  it('shows error message and Retry when balance fetch fails', async () => {
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json({}, { status: 500 })),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => HttpResponse.json(makeMonthBalance())),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json([])),
    );
    renderWithProviders(<DashboardScreen />);
    await waitFor(() => expect(screen.getByText("Couldn't load balance.")).toBeTruthy());
    expect(screen.getAllByText('Retry').length).toBeGreaterThan(0);
  });

  it('shows Retry when Retry is pressed and refetch called', async () => {
    let callCount = 0;
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => {
        callCount++;
        return callCount === 1
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json(makeBalance({ balance: 100 }));
      }),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => HttpResponse.json(makeMonthBalance())),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json([])),
    );
    renderWithProviders(<DashboardScreen />);
    await waitFor(() => expect(screen.getByText("Couldn't load balance.")).toBeTruthy());
    fireEvent.press(screen.getAllByText('Retry')[0]);
    await waitFor(() => expect(screen.getByText('+100')).toBeTruthy());
  });

  it('shows empty periodic expenses message', async () => {
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json(makeBalance())),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => HttpResponse.json(makeMonthBalance())),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json([])),
    );
    renderWithProviders(<DashboardScreen />);
    await waitFor(() =>
      expect(screen.getByText('No periodic expenses this month')).toBeTruthy(),
    );
  });

  it('covers isLoading branch in MonthBalanceSection while fetch is pending', () => {
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json(makeBalance())),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => new Promise(() => {})),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json([])),
    );
    renderWithProviders(<DashboardScreen />);
    expect(screen.getByText('Month balance')).toBeTruthy();
  });

  it('covers isLoading branch in PeriodicExpensesSection while fetch is pending', () => {
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json(makeBalance())),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => HttpResponse.json(makeMonthBalance())),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => new Promise(() => {})),
    );
    renderWithProviders(<DashboardScreen />);
    expect(screen.getByText(/Periodic expenses/)).toBeTruthy();
  });

  it('shows negative balance without + prefix', async () => {
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json(makeBalance({ balance: -200 }))),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => HttpResponse.json(makeMonthBalance())),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json([])),
    );
    renderWithProviders(<DashboardScreen />);
    await waitFor(() => expect(screen.getByText('-200')).toBeTruthy());
  });

  it('sorts periodic expenses with null due_day last and shows "No due date"', async () => {
    const items = [
      makeDuePeriodicExpense({ subcategory_name: 'Internet', subcategory_id: 'sub-3', due_day: null }),
      makeDuePeriodicExpense({ subcategory_name: 'Rent', subcategory_id: 'sub-4', due_day: 1 }),
      makeDuePeriodicExpense({ subcategory_name: 'Phone', subcategory_id: 'sub-5', due_day: null }),
      makeDuePeriodicExpense({ subcategory_name: 'Electricity', subcategory_id: 'sub-6', due_day: 15 }),
    ];
    server.use(
      http.get(`${BASE}/${dashboardPaths.balance}`, () => HttpResponse.json(makeBalance())),
      http.get(`${BASE}/${dashboardPaths.monthBalance}`, () => HttpResponse.json(makeMonthBalance())),
      http.get(`${BASE}/${dashboardPaths.duePeriodicExpenses}`, () => HttpResponse.json(items)),
    );
    renderWithProviders(<DashboardScreen />);
    await waitFor(() => expect(screen.getAllByText('No due date')).toHaveLength(2));
    expect(screen.getByText('Due on day 1')).toBeTruthy();
    expect(screen.getByText('Due on day 15')).toBeTruthy();
  });
});
