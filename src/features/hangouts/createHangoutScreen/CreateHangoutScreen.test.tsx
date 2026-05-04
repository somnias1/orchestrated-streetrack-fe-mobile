import { config } from '@/config';
import { makeHangout } from '@/services/hangouts/__mocks__/hangout-fixtures';
import { hangoutsPaths } from '@/services/hangouts/constants';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { useRouter } from 'expo-router';
import { http, HttpResponse } from 'msw';
import React from 'react';
import CreateHangoutScreen from '.';
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

describe('CreateHangoutScreen', () => {
  it('renders with "New Hangout" header and "Save hangout" button', () => {
    renderWithProviders(<CreateHangoutScreen />);
    expect(screen.getByText('New Hangout')).toBeTruthy();
    expect(screen.getByText('Save hangout')).toBeTruthy();
  });

  it('calls router.back after successful submit', async () => {
    server.use(
      http.post(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangout({ name: 'Party' }))),
    );
    renderWithProviders(<CreateHangoutScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Hangout name…'), 'Party');
    fireEvent.press(screen.getByText('Save hangout'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('shows submit error when POST fails', async () => {
    server.use(
      http.post(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json({}, { status: 500 })),
    );
    renderWithProviders(<CreateHangoutScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Hangout name…'), 'Party');
    fireEvent.press(screen.getByText('Save hangout'));
    await waitFor(() =>
      expect(screen.getByText('Failed to save hangout. Please try again.')).toBeTruthy(),
    );
    expect(mockBack).not.toHaveBeenCalled();
  });
});
