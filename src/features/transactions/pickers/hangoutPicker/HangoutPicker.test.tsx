import { config } from '@/config';
import {
  makeHangout,
  makeHangoutListPage,
} from '@/services/hangouts/__mocks__/hangout-fixtures';
import { hangoutsPaths } from '@/services/hangouts/constants';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { http, HttpResponse } from 'msw';
import React from 'react';
import HangoutPicker from '.';
import { server } from '../../../../../__tests__/setup';

const BASE = config.apiBaseUrl;

describe('HangoutPicker', () => {
  it('renders the picker title', () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([]))),
    );
    renderWithProviders(
      <HangoutPicker onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByText('Select hangout (optional)')).toBeTruthy();
  });

  it('shows hangout items from the API', async () => {
    const items = [makeHangout({ name: 'Weekend Trip' }), makeHangout({ name: 'Game Night' })];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage(items))),
    );
    renderWithProviders(
      <HangoutPicker onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('Weekend Trip')).toBeTruthy());
    expect(screen.getByText('Game Night')).toBeTruthy();
  });

  it('shows "Clear hangout" option', () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([]))),
    );
    renderWithProviders(
      <HangoutPicker onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByText('Clear hangout')).toBeTruthy();
  });

  it('calls onSelect with null when Clear hangout is pressed', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([]))),
    );
    renderWithProviders(
      <HangoutPicker onSelect={onSelect} onClose={onClose} />,
    );
    fireEvent.press(screen.getByText('Clear hangout'));
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders hangout items without a date gracefully', async () => {
    const hangout = makeHangout({ name: 'Undated Trip', date: '' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([hangout]))),
    );
    renderWithProviders(
      <HangoutPicker onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('Undated Trip')).toBeTruthy());
  });

  it('calls onSelect with hangout when item is pressed', async () => {
    const hangout = makeHangout({ name: 'Dinner Party' });
    const onSelect = jest.fn();
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([hangout]))),
    );
    renderWithProviders(
      <HangoutPicker onSelect={onSelect} onClose={jest.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('Dinner Party')).toBeTruthy());
    fireEvent.press(screen.getByText('Dinner Party'));
    expect(onSelect).toHaveBeenCalledWith(hangout);
  });
});
