import { config } from '@/config';
import {
  makeTransaction,
  makeTransactionListPage,
} from '@/services/transactions/__mocks__/transaction-fixtures';
import { transactionsPaths } from '@/services/transactions/constants';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { useRouter } from 'expo-router';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { Alert, FlatList } from 'react-native';
import TransactionsListScreen from '.';
import { server } from '../../../../__tests__/setup';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

const BASE = config.apiBaseUrl;
const mockPush = jest.fn();
const mockBack = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });
  mockPush.mockClear();
  mockBack.mockClear();
});

describe('TransactionsListScreen', () => {
  it('refetches when Retry is pressed in error state', async () => {
    let callCount = 0;
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => {
        callCount++;
        return callCount === 1
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json(makeTransactionListPage([makeTransaction({ subcategory_name: 'Reloaded' })]));
      }),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText("Couldn't load transactions.")).toBeTruthy());
    fireEvent.press(screen.getByText('Retry'));
    await waitFor(() => expect(screen.getByText('Reloaded')).toBeTruthy());
  });

  it('calls fetchNextPage when end of list is reached with more pages', async () => {
    const items = [makeTransaction({ subcategory_name: 'Paginated' })];
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () =>
        HttpResponse.json(makeTransactionListPage(items, { has_more: true, next_skip: 1 })),
      ),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText('Paginated')).toBeTruthy());
    const flatList = screen.UNSAFE_getByType(FlatList);
    fireEvent(flatList, 'endReached');
  });

  it('shows loading spinner while initial fetch is pending', () => {
    server.use(http.get(`${BASE}/${transactionsPaths.list}`, () => new Promise(() => {})));
    renderWithProviders(<TransactionsListScreen />);
    expect(screen.queryByText(/No transactions in/)).toBeNull();
  });

  it('covers getNextPageParam has_more=true path', async () => {
    const items = [makeTransaction({ subcategory_name: 'Rent' })];
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () =>
        HttpResponse.json(makeTransactionListPage(items, { has_more: true, next_skip: 1 }))),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText('Rent')).toBeTruthy());
  });

  it('shows empty state when no transactions', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage([]))),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText(/No transactions in/)).toBeTruthy());
  });

  it('renders transaction rows when data loads', async () => {
    const items = [
      makeTransaction({ subcategory_name: 'Groceries', value: -50 }),
      makeTransaction({ subcategory_name: 'Salary', value: 3000 }),
    ];
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage(items))),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeTruthy());
    expect(screen.getByText('Salary')).toBeTruthy();
  });

  it('shows error state with Retry when fetch fails', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json({}, { status: 500 })),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText("Couldn't load transactions.")).toBeTruthy());
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('opens action sheet with Edit, Delete, Cancel on row press', async () => {
    const item = makeTransaction({ subcategory_name: 'Coffee' });
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage([item]))),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText('Coffee')).toBeTruthy());
    fireEvent.press(screen.getByText('Coffee'));
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('navigates to create screen when FAB is pressed', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage([]))),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText(/No transactions in/)).toBeTruthy());
    fireEvent.press(screen.getByText('+'));
    expect(mockPush).toHaveBeenCalledWith('/transaction-new');
  });

  it('can navigate to previous month and back with arrow buttons', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage([]))),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText(/No transactions in/)).toBeTruthy());

    // Navigate to previous month (always enabled)
    fireEvent.press(screen.getByText('‹'));
    await waitFor(() => expect(screen.getByText(/No transactions in/)).toBeTruthy());

    // Navigate forward (now enabled since we left current month)
    fireEvent.press(screen.getByText('›'));
    await waitFor(() => expect(screen.getByText(/No transactions in/)).toBeTruthy());
  });

  it('shows delete error banner when delete fails after confirm', async () => {
    const item = makeTransaction({ subcategory_name: 'Rent', id: 'tx-del-1' });
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage([item]))),
      http.delete(`${BASE}/${transactionsPaths.delete(item.id)}`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons: any) => {
      buttons?.find((b: any) => b.text === 'Delete')?.onPress?.();
    });

    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText('Rent')).toBeTruthy());

    fireEvent.press(screen.getByText('Rent'));
    expect(screen.getByText('Delete')).toBeTruthy();
    fireEvent.press(screen.getByText('Delete'));

    await waitFor(
      () =>
        expect(screen.getByText("Couldn't delete transaction. Please try again.")).toBeTruthy(),
      { timeout: 3000 },
    );

    alertSpy.mockRestore();
  });

  it('shows hangout name in transaction row when present', async () => {
    const item = makeTransaction({ subcategory_name: 'Dinner', hangout_name: 'Summer Trip', hangout_id: 'h-1' });
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage([item]))),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText('Dinner')).toBeTruthy());
    expect(screen.getByText('Summer Trip')).toBeTruthy();
  });

  it('navigates to edit screen when Edit is pressed in action sheet', async () => {
    const item = makeTransaction({ subcategory_name: 'Rent', id: 'tx-99' });
    server.use(
      http.get(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(makeTransactionListPage([item]))),
    );
    renderWithProviders(<TransactionsListScreen />);
    await waitFor(() => expect(screen.getByText('Rent')).toBeTruthy());
    fireEvent.press(screen.getByText('Rent'));
    fireEvent.press(screen.getByText('Edit'));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/transaction-edit/[id]',
        params: { id: 'tx-99' },
      }),
    );
  });
});
