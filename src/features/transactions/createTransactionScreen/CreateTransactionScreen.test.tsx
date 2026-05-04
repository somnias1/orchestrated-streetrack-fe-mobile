import { config } from '@/config';
import { makeSubcategory, makeSubcategoryListPage } from '@/services/subcategories/__mocks__/subcategory-fixtures';
import { subcategoriesPaths } from '@/services/subcategories/constants';
import { makeTransaction } from '@/services/transactions/__mocks__/transaction-fixtures';
import { transactionsPaths } from '@/services/transactions/constants';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { useRouter } from 'expo-router';
import { http, HttpResponse } from 'msw';
import React from 'react';
import CreateTransactionScreen from '.';
import { server } from '../../../../__tests__/setup';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

const BASE = config.apiBaseUrl;
const mockBack = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ back: mockBack, push: jest.fn() });
  mockBack.mockClear();
});

describe('CreateTransactionScreen', () => {
  it('renders "New Transaction" header and "Save transaction" button', () => {
    renderWithProviders(<CreateTransactionScreen />);
    expect(screen.getByText('New Transaction')).toBeTruthy();
    expect(screen.getByText('Save transaction')).toBeTruthy();
  });

  it('shows validation errors when submitted without required fields', async () => {
    const onSubmit = jest.fn();
    renderWithProviders(<CreateTransactionScreen />);
    fireEvent.press(screen.getByText('Save transaction'));
    await waitFor(() => expect(screen.getByText('Value must not be zero')).toBeTruthy());
  });

  it('submits the form and navigates back on success', async () => {
    const sub = makeSubcategory({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Food' });
    const tx = makeTransaction();
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () => HttpResponse.json(makeSubcategoryListPage([sub]))),
      http.post(`${BASE}/${transactionsPaths.list}`, () => HttpResponse.json(tx, { status: 201 })),
    );
    renderWithProviders(<CreateTransactionScreen />);

    fireEvent.press(screen.getByText('Select subcategory…'));
    await waitFor(() => expect(screen.getByText('Food')).toBeTruthy());
    fireEvent.press(screen.getByText('Food'));

    await waitFor(() => expect(screen.queryByText('Select subcategory…')).toBeNull());
    fireEvent.changeText(screen.getByPlaceholderText('0.00'), '75');
    fireEvent.changeText(screen.getByPlaceholderText('What was this for?'), 'Groceries');

    fireEvent.press(screen.getByText('Save transaction'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('opens subcategory picker on press', async () => {
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () =>
        HttpResponse.json(makeSubcategoryListPage([makeSubcategory({ name: 'Dining' })])),
      ),
    );
    renderWithProviders(<CreateTransactionScreen />);
    fireEvent.press(screen.getByText('Select subcategory…'));
    await waitFor(() => expect(screen.getByText('Select subcategory')).toBeTruthy());
  });
});
