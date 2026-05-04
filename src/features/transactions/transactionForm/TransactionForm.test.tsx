import { config } from '@/config';
import { makeHangout, makeHangoutListPage } from '@/services/hangouts/__mocks__/hangout-fixtures';
import { hangoutsPaths } from '@/services/hangouts/constants';
import { makeSubcategory, makeSubcategoryListPage } from '@/services/subcategories/__mocks__/subcategory-fixtures';
import { subcategoriesPaths } from '@/services/subcategories/constants';
import { todayISO } from '@/utils/format';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { useRouter } from 'expo-router';
import { http, HttpResponse } from 'msw';
import React from 'react';
import TransactionForm, { defaultTransactionValues } from '.';
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

describe('TransactionForm', () => {
  it('renders header title and submit label', () => {
    renderWithProviders(
      <TransactionForm
        defaultValues={defaultTransactionValues}
        submitLabel="Save transaction"
        headerTitle="New Transaction"
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByText('New Transaction')).toBeTruthy();
    expect(screen.getByText('Save transaction')).toBeTruthy();
  });

  it('prevents submission without required fields and shows value error', async () => {
    const onSubmit = jest.fn();
    renderWithProviders(
      <TransactionForm
        defaultValues={defaultTransactionValues}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={onSubmit}
      />,
    );
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByText('Value must not be zero')).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows description validation error on submit without description', async () => {
    renderWithProviders(
      <TransactionForm
        defaultValues={{
          ...defaultTransactionValues,
          subcategory_id: '550e8400-e29b-41d4-a716-446655440000',
          value: 100,
          description: '',
        }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByText('Description is required')).toBeTruthy());
  });

  it('shows submit error when onSubmit throws', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('network'));
    renderWithProviders(
      <TransactionForm
        defaultValues={{
          ...defaultTransactionValues,
          subcategory_id: '550e8400-e29b-41d4-a716-446655440000',
          value: 50,
          description: 'Lunch',
        }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={onSubmit}
      />,
    );
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() =>
      expect(screen.getByText('Failed to save transaction. Please try again.')).toBeTruthy(),
    );
  });

  it('pre-fills description with initialSubcategoryName shown in subcategory field', () => {
    renderWithProviders(
      <TransactionForm
        defaultValues={{
          ...defaultTransactionValues,
          subcategory_id: '550e8400-e29b-41d4-a716-446655440000',
          value: 75,
          description: 'Dinner out',
        }}
        submitLabel="Save changes"
        headerTitle="Edit"
        onSubmit={jest.fn()}
        initialSubcategoryName="Food"
      />,
    );
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByDisplayValue('Dinner out')).toBeTruthy();
  });

  it('opens date picker when date field is pressed', () => {
    renderWithProviders(
      <TransactionForm
        defaultValues={{ ...defaultTransactionValues, date: todayISO() }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('date-time-picker')).toBeNull();
    fireEvent.press(screen.getByText(new Date(todayISO()).toLocaleDateString()));
    expect(screen.getByTestId('date-time-picker')).toBeTruthy();
  });

  it('selects subcategory and displays name in field', async () => {
    const sub = makeSubcategory({ name: 'Transport' });
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () => HttpResponse.json(makeSubcategoryListPage([sub]))),
    );
    renderWithProviders(
      <TransactionForm
        defaultValues={defaultTransactionValues}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Select subcategory…'));
    await waitFor(() => expect(screen.getByText('Transport')).toBeTruthy());
    fireEvent.press(screen.getByText('Transport'));
    // After selection, the subcategory name appears in the field
    expect(screen.queryByText('Select subcategory…')).toBeNull();
  });

  it('opens hangout picker when hangout field is pressed', async () => {
    const hangout = makeHangout({ name: 'Weekend Trip' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([hangout]))),
    );
    renderWithProviders(
      <TransactionForm
        defaultValues={defaultTransactionValues}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('None'));
    await waitFor(() => expect(screen.getByText('Select hangout (optional)')).toBeTruthy());
  });

  it('opens subcategory picker and shows items', async () => {
    const sub = makeSubcategory({ name: 'Transport' });
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () => HttpResponse.json(makeSubcategoryListPage([sub]))),
    );
    renderWithProviders(
      <TransactionForm
        defaultValues={defaultTransactionValues}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Select subcategory…'));
    await waitFor(() => expect(screen.getByText('Transport')).toBeTruthy());
  });

  it('shows activity indicator instead of submit label while submitting', async () => {
    let resolveSubmit!: () => void;
    const slowSubmit = jest.fn().mockReturnValue(
      new Promise<void>((resolve) => { resolveSubmit = resolve; }),
    );
    renderWithProviders(
      <TransactionForm
        defaultValues={{
          subcategory_id: '550e8400-e29b-41d4-a716-446655440000',
          value: 50,
          description: 'Lunch',
          date: todayISO(),
          hangout_id: null,
        }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={slowSubmit}
      />,
    );
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() => expect(screen.queryByText('Save')).toBeNull());
    resolveSubmit();
  });

  it('selects a hangout from the picker and shows its name', async () => {
    const hangout = makeHangout({ name: 'Birthday Party' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([hangout]))),
    );
    renderWithProviders(
      <TransactionForm
        defaultValues={defaultTransactionValues}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('None'));
    await waitFor(() => expect(screen.getByText('Birthday Party')).toBeTruthy());
    fireEvent.press(screen.getByText('Birthday Party'));
    await waitFor(() => expect(screen.queryByText('None')).toBeNull());
  });

  it('clears a pre-filled hangout via the Clear hangout option', async () => {
    const hangout = makeHangout({ name: 'Dinner Out' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([hangout]))),
    );
    renderWithProviders(
      <TransactionForm
        defaultValues={{ ...defaultTransactionValues, hangout_id: hangout.id }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
        initialHangoutName="Dinner Out"
      />,
    );
    expect(screen.getByText('Dinner Out')).toBeTruthy();
    fireEvent.press(screen.getByText('Dinner Out'));
    await waitFor(() => expect(screen.getByText('Clear hangout')).toBeTruthy());
    fireEvent.press(screen.getByText('Clear hangout'));
    await waitFor(() => expect(screen.getByText('None')).toBeTruthy());
  });

  it('calls router.back when Cancel is pressed', () => {
    renderWithProviders(
      <TransactionForm
        defaultValues={defaultTransactionValues}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Cancel'));
    expect(mockBack).toHaveBeenCalled();
  });
});
