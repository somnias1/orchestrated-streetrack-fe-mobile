import { todayISO } from '@/utils/format';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { useRouter } from 'expo-router';
import React from 'react';
import HangoutForm, { defaultHangoutValues } from '.';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

const mockBack = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ back: mockBack, push: jest.fn() });
  mockBack.mockClear();
});

describe('HangoutForm', () => {
  it('renders header title and submit label', () => {
    renderWithProviders(
      <HangoutForm
        defaultValues={defaultHangoutValues}
        submitLabel="Save hangout"
        headerTitle="New Hangout"
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByText('New Hangout')).toBeTruthy();
    expect(screen.getByText('Save hangout')).toBeTruthy();
  });

  it('shows name validation error on submit without name', async () => {
    renderWithProviders(
      <HangoutForm
        defaultValues={{ ...defaultHangoutValues, name: '' }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByText('Name is required')).toBeTruthy());
  });

  it('shows submit error when onSubmit throws', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
    renderWithProviders(
      <HangoutForm
        defaultValues={{ ...defaultHangoutValues, name: 'Test Hangout' }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={onSubmit}
      />,
    );
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() =>
      expect(screen.getByText('Failed to save hangout. Please try again.')).toBeTruthy(),
    );
  });

  it('pre-fills name field with defaultValues', () => {
    renderWithProviders(
      <HangoutForm
        defaultValues={{ name: 'Pre-filled Name', date: todayISO(), description: null }}
        submitLabel="Save"
        headerTitle="Edit"
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Pre-filled Name')).toBeTruthy();
  });

  it('opens DateTimePicker when the date field is pressed', () => {
    renderWithProviders(
      <HangoutForm
        defaultValues={{ name: '', date: todayISO(), description: null }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('date-time-picker')).toBeNull();
    // The date field shows a localized date string - press it to open the picker
    fireEvent.press(screen.getByText(new Date(todayISO()).toLocaleDateString()));
    expect(screen.getByTestId('date-time-picker')).toBeTruthy();
  });

  it('shows activity indicator instead of submit label while submitting', async () => {
    let resolveSubmit!: () => void;
    const slowSubmit = jest.fn().mockReturnValue(
      new Promise<void>((resolve) => { resolveSubmit = resolve; }),
    );
    renderWithProviders(
      <HangoutForm
        defaultValues={{ name: 'Test Hangout', date: todayISO(), description: null }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={slowSubmit}
      />,
    );
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() => expect(screen.queryByText('Save')).toBeNull());
    resolveSubmit();
  });

  it('clears description field to null when emptied', () => {
    renderWithProviders(
      <HangoutForm
        defaultValues={{ name: 'Test', date: todayISO(), description: 'Some notes' }}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    const descField = screen.getByDisplayValue('Some notes');
    fireEvent.changeText(descField, '');
    expect(screen.queryByDisplayValue('Some notes')).toBeNull();
  });

  it('calls router.back when Cancel is pressed', () => {
    renderWithProviders(
      <HangoutForm
        defaultValues={defaultHangoutValues}
        submitLabel="Save"
        headerTitle="Test"
        onSubmit={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Cancel'));
    expect(mockBack).toHaveBeenCalled();
  });
});
