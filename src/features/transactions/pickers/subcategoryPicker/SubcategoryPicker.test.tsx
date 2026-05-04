import { config } from '@/config';
import {
  makeSubcategory,
  makeSubcategoryListPage,
} from '@/services/subcategories/__mocks__/subcategory-fixtures';
import { subcategoriesPaths } from '@/services/subcategories/constants';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '__tests__/test-utils';
import { http, HttpResponse } from 'msw';
import React from 'react';
import SubcategoryPicker from '.';
import { server } from '../../../../../__tests__/setup';

const BASE = config.apiBaseUrl;

describe('SubcategoryPicker', () => {
  it('renders the picker title', () => {
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () => HttpResponse.json(makeSubcategoryListPage([]))),
    );
    renderWithProviders(
      <SubcategoryPicker onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByText('Select subcategory')).toBeTruthy();
  });

  it('shows subcategory items from the API', async () => {
    const items = [
      makeSubcategory({ name: 'Dining Out' }),
      makeSubcategory({ name: 'Groceries' }),
    ];
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () => HttpResponse.json(makeSubcategoryListPage(items))),
    );
    renderWithProviders(
      <SubcategoryPicker onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('Dining Out')).toBeTruthy());
    expect(screen.getByText('Groceries')).toBeTruthy();
  });

  it('shows empty label when no subcategories found', async () => {
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () => HttpResponse.json(makeSubcategoryListPage([]))),
    );
    renderWithProviders(
      <SubcategoryPicker onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('No subcategories found')).toBeTruthy());
  });

  it('shows loading spinner while fetching and hides empty label', () => {
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () => new Promise(() => {})),
    );
    renderWithProviders(
      <SubcategoryPicker onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    // isLoading=true, items=[] → loading spinner renders instead of list/empty label
    expect(screen.queryByText('No subcategories found')).toBeNull();
  });

  it('calls onSelect with subcategory when item is pressed', async () => {
    const sub = makeSubcategory({ name: 'Transport' });
    const onSelect = jest.fn();
    server.use(
      http.get(`${BASE}/${subcategoriesPaths.list}`, () => HttpResponse.json(makeSubcategoryListPage([sub]))),
    );
    renderWithProviders(
      <SubcategoryPicker onSelect={onSelect} onClose={jest.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('Transport')).toBeTruthy());
    fireEvent.press(screen.getByText('Transport'));
    expect(onSelect).toHaveBeenCalledWith(sub);
  });
});
