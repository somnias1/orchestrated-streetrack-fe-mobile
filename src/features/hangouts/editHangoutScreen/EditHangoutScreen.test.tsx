import { config } from '@/config';
import { makeHangout } from '@/services/hangouts/__mocks__/hangout-fixtures';
import { hangoutsPaths } from '@/services/hangouts/constants';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { Alert } from 'react-native';
import EditHangoutScreen from '.';
import { server } from '../../../../__tests__/setup';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const BASE = config.apiBaseUrl;
const TEST_ID = 'hangout-edit-id';
const mockBack = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ back: mockBack, push: jest.fn() });
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: TEST_ID });
  mockBack.mockClear();
});

describe('EditHangoutScreen', () => {
  it('shows "Hangout no longer exists" for a 404 response', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get(TEST_ID)}`, () => HttpResponse.json({}, { status: 404 })),
    );
    renderWithProviders(<EditHangoutScreen />);
    await waitFor(() =>
      expect(screen.getByText('Hangout no longer exists.')).toBeTruthy(),
    );
    expect(screen.getByText('Go back')).toBeTruthy();
  });

  it('shows Retry for non-404 fetch errors', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get(TEST_ID)}`, () => HttpResponse.json({}, { status: 500 })),
    );
    renderWithProviders(<EditHangoutScreen />);
    await waitFor(() =>
      expect(screen.getByText("Couldn't load hangout.")).toBeTruthy(),
    );
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('pre-fills form with hangout data on success', async () => {
    const hangout = makeHangout({ id: TEST_ID, name: 'Rooftop Party' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get(TEST_ID)}`, () => HttpResponse.json(hangout)),
    );
    renderWithProviders(<EditHangoutScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Rooftop Party')).toBeTruthy());
    expect(screen.getByText('Save changes')).toBeTruthy();
    expect(screen.getByText('Edit Hangout')).toBeTruthy();
  });

  it('calls router.back after confirming delete successfully', async () => {
    const hangout = makeHangout({ id: TEST_ID, name: 'To Delete' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get(TEST_ID)}`, () => HttpResponse.json(hangout)),
      http.delete(`${BASE}/${hangoutsPaths.delete(TEST_ID)}`, () => new Response(null, { status: 204 })),
    );
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementationOnce((_t, _m, buttons: any) => {
      buttons?.find((b: any) => b.text === 'Delete')?.onPress?.();
    });

    renderWithProviders(<EditHangoutScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('To Delete')).toBeTruthy());
    fireEvent.press(screen.getByText('Delete'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());

    alertSpy.mockRestore();
  });

  it('calls router.back after successful update', async () => {
    const hangout = makeHangout({ id: TEST_ID, name: 'Old Name' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get(TEST_ID)}`, () => HttpResponse.json(hangout)),
      http.patch(`${BASE}/${hangoutsPaths.update(TEST_ID)}`, () =>
        HttpResponse.json({ ...hangout, name: 'New Name' }),
      ),
    );
    renderWithProviders(<EditHangoutScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Old Name')).toBeTruthy());
    fireEvent.changeText(screen.getByDisplayValue('Old Name'), 'New Name');
    fireEvent.press(screen.getByText('Save changes'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('shows a Delete button in the header', async () => {
    const hangout = makeHangout({ id: TEST_ID, name: 'Deletable' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.get(TEST_ID)}`, () => HttpResponse.json(hangout)),
    );
    renderWithProviders(<EditHangoutScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Deletable')).toBeTruthy());
    expect(screen.getByText('Delete')).toBeTruthy();
  });
});
