import { config } from '@/config';
import { makeTransaction } from '@/services/transactions/__mocks__/transaction-fixtures';
import { transactionsPaths } from '@/services/transactions/constants';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { Alert } from 'react-native';
import EditTransactionScreen from '.';
import { server } from '../../../../__tests__/setup';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const BASE = config.apiBaseUrl;
const TEST_ID = 'tx-edit-id';
const mockBack = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ back: mockBack, push: jest.fn() });
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: TEST_ID });
  mockBack.mockClear();
});

describe('EditTransactionScreen', () => {
  it('shows "Transaction no longer exists" for a 404 response', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.get(TEST_ID)}`, () =>
        HttpResponse.json({}, { status: 404 }),
      ),
    );
    renderWithProviders(<EditTransactionScreen />);
    await waitFor(() =>
      expect(screen.getByText('Transaction no longer exists.')).toBeTruthy(),
    );
    expect(screen.getByText('Go back')).toBeTruthy();
  });

  it('shows Retry for non-404 fetch errors', async () => {
    server.use(
      http.get(`${BASE}/${transactionsPaths.get(TEST_ID)}`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    renderWithProviders(<EditTransactionScreen />);
    await waitFor(() =>
      expect(screen.getByText("Couldn't load transaction.")).toBeTruthy(),
    );
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('pre-fills form with transaction data on success', async () => {
    const tx = makeTransaction({
      id: TEST_ID,
      description: 'Monthly rent',
      subcategory_name: 'Housing',
      value: -1200,
    });
    server.use(
      http.get(`${BASE}/${transactionsPaths.get(TEST_ID)}`, () => HttpResponse.json(tx)),
    );
    renderWithProviders(<EditTransactionScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Monthly rent')).toBeTruthy());
    expect(screen.getByText('Housing')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeTruthy();
    expect(screen.getByText('Edit Transaction')).toBeTruthy();
  });

  it('shows a Delete button in the header', async () => {
    const tx = makeTransaction({ id: TEST_ID, description: 'Lunch' });
    server.use(
      http.get(`${BASE}/${transactionsPaths.get(TEST_ID)}`, () => HttpResponse.json(tx)),
    );
    renderWithProviders(<EditTransactionScreen />);
    await waitFor(() => expect(screen.getByText('Edit Transaction')).toBeTruthy());
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('calls router.back after confirming delete successfully', async () => {
    const tx = makeTransaction({ id: TEST_ID, description: 'To Delete' });
    server.use(
      http.get(`${BASE}/${transactionsPaths.get(TEST_ID)}`, () => HttpResponse.json(tx)),
      http.delete(`${BASE}/${transactionsPaths.delete(TEST_ID)}`, () => new Response(null, { status: 204 })),
    );
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementationOnce((_t, _m, buttons: any) => {
      buttons?.find((b: any) => b.text === 'Delete')?.onPress?.();
    });

    renderWithProviders(<EditTransactionScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('To Delete')).toBeTruthy());
    fireEvent.press(screen.getByText('Delete'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());

    alertSpy.mockRestore();
  });

  it('calls router.back after successful update', async () => {
    const tx = makeTransaction({
      id: TEST_ID,
      description: 'Old desc',
      subcategory_id: '550e8400-e29b-41d4-a716-446655440001',
    });
    server.use(
      http.get(`${BASE}/${transactionsPaths.get(TEST_ID)}`, () => HttpResponse.json(tx)),
      http.patch(`${BASE}/${transactionsPaths.update(TEST_ID)}`, () =>
        HttpResponse.json({ ...tx, description: 'New desc' }),
      ),
    );
    renderWithProviders(<EditTransactionScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Old desc')).toBeTruthy());
    fireEvent.changeText(screen.getByDisplayValue('Old desc'), 'New desc');
    fireEvent.press(screen.getByText('Save changes'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});
