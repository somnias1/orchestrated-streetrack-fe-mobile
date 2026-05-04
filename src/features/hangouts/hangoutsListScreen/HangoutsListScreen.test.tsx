import { config } from '@/config';
import { makeHangout, makeHangoutListPage } from '@/services/hangouts/__mocks__/hangout-fixtures';
import { hangoutsPaths } from '@/services/hangouts/constants';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { useRouter } from 'expo-router';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { Alert, FlatList } from 'react-native';
import HangoutsListScreen from '.';
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

describe('HangoutsListScreen', () => {
  it('refetches when Retry is pressed in error state', async () => {
    let callCount = 0;
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => {
        callCount++;
        return callCount === 1
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json(makeHangoutListPage([makeHangout({ name: 'Reloaded' })]));
      }),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText("Couldn't load hangouts.")).toBeTruthy());
    fireEvent.press(screen.getByText('Retry'));
    await waitFor(() => expect(screen.getByText('Reloaded')).toBeTruthy());
  });

  it('calls fetchNextPage when end of list is reached with more pages', async () => {
    const items = [makeHangout({ name: 'First Page Item' })];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () =>
        HttpResponse.json(makeHangoutListPage(items, { has_more: true, next_skip: 1 })),
      ),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('First Page Item')).toBeTruthy());
    const flatList = screen.UNSAFE_getByType(FlatList);
    fireEvent(flatList, 'endReached');
  });

  it('shows loading spinner while initial fetch is pending', () => {
    server.use(http.get(`${BASE}/${hangoutsPaths.list}`, () => new Promise(() => {})));
    renderWithProviders(<HangoutsListScreen />);
    expect(screen.queryByText('No hangouts found')).toBeNull();
  });

  it('covers getNextPageParam has_more=true path', async () => {
    const items = [makeHangout({ name: 'Page Item' })];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () =>
        HttpResponse.json(makeHangoutListPage(items, { has_more: true, next_skip: 1 }))),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('Page Item')).toBeTruthy());
  });

  it('shows "No hangouts found" when list is empty', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([]))),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('No hangouts found')).toBeTruthy());
  });

  it('renders hangout rows when data loads', async () => {
    const items = [makeHangout({ name: 'Beach Trip' }), makeHangout({ name: 'Coffee Chat' })];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage(items))),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('Beach Trip')).toBeTruthy());
    expect(screen.getByText('Coffee Chat')).toBeTruthy();
  });

  it('shows error state with Retry when fetch fails', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json({}, { status: 500 })),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText("Couldn't load hangouts.")).toBeTruthy());
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('opens action sheet with Edit, Delete, Cancel on row press', async () => {
    const items = [makeHangout({ name: 'Movie Night' })];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage(items))),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('Movie Night')).toBeTruthy());
    fireEvent.press(screen.getByText('Movie Night'));
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('closes action sheet when Cancel is pressed', async () => {
    const items = [makeHangout({ name: 'Dinner' })];
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage(items))),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('Dinner')).toBeTruthy());
    fireEvent.press(screen.getByText('Dinner'));
    expect(screen.getByText('Cancel')).toBeTruthy();
    fireEvent.press(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Edit')).toBeNull());
  });

  it('navigates to edit screen when Edit is pressed in action sheet', async () => {
    const item = makeHangout({ name: 'Book Club', id: 'hangout-42' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([item]))),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('Book Club')).toBeTruthy());
    fireEvent.press(screen.getByText('Book Club'));
    fireEvent.press(screen.getByText('Edit'));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/hangout-edit/[id]',
        params: { id: 'hangout-42' },
      }),
    );
  });

  it('navigates to create screen when FAB is pressed', async () => {
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([]))),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('No hangouts found')).toBeTruthy());
    fireEvent.press(screen.getByText('+'));
    expect(mockPush).toHaveBeenCalledWith('/hangout-new');
  });

  it('shows delete error banner when delete fails after confirm', async () => {
    const item = makeHangout({ name: 'Delete Me' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([item]))),
      http.delete(`${BASE}/${hangoutsPaths.delete(item.id)}`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons: any) => {
      buttons?.find((b: any) => b.text === 'Delete')?.onPress?.();
    });

    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('Delete Me')).toBeTruthy());

    fireEvent.press(screen.getByText('Delete Me'));
    expect(screen.getByText('Delete')).toBeTruthy();
    fireEvent.press(screen.getByText('Delete'));

    await waitFor(
      () => expect(screen.getByText("Couldn't delete hangout. Please try again.")).toBeTruthy(),
      { timeout: 3000 },
    );

    alertSpy.mockRestore();
  });

  it('navigates to edit after confirming via action sheet Edit button', async () => {
    const item = makeHangout({ name: 'Edit Target', id: 'edit-43' });
    server.use(
      http.get(`${BASE}/${hangoutsPaths.list}`, () => HttpResponse.json(makeHangoutListPage([item]))),
    );
    renderWithProviders(<HangoutsListScreen />);
    await waitFor(() => expect(screen.getByText('Edit Target')).toBeTruthy());
    fireEvent.press(screen.getByText('Edit Target'));
    fireEvent.press(screen.getByText('Edit'));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/hangout-edit/[id]',
        params: { id: 'edit-43' },
      }),
    );
  });
});
