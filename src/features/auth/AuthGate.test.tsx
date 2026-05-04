import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AuthGate } from './AuthGate';
import { useAuthSession } from './useAuthSession';
import { Text } from 'react-native';

jest.mock('./useAuthSession', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('expo-router', () => {
  const R = require('react');
  const { Text: T } = require('react-native');
  return {
    Redirect: ({ href }: any) => R.createElement(T, null, `redirect:${href}`),
  };
});
jest.mock('./SplashView', () => {
  const R = require('react');
  const { Text: T } = require('react-native');
  return {
    SplashView: () => R.createElement(T, null, 'Loading…'),
  };
});

const mockUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;

describe('AuthGate', () => {
  it('renders SplashView while loading', () => {
    mockUseAuthSession.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      signingIn: false,
      error: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });
    render(<AuthGate><Text>Content</Text></AuthGate>);
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByText('Content')).toBeNull();
  });

  it('renders children when authenticated', () => {
    mockUseAuthSession.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { name: 'Test User' } as any,
      signingIn: false,
      error: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });
    render(<AuthGate><Text>Content</Text></AuthGate>);
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('redirects to sign-in when not authenticated', () => {
    mockUseAuthSession.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      signingIn: false,
      error: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });
    render(<AuthGate><Text>Content</Text></AuthGate>);
    expect(screen.getByText('redirect:/sign-in')).toBeTruthy();
    expect(screen.queryByText('Content')).toBeNull();
  });
});
