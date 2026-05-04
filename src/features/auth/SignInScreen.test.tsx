import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SignInScreen } from './SignInScreen';
import { useAuthSession } from './useAuthSession';

jest.mock('./useAuthSession', () => ({
  useAuthSession: jest.fn(),
}));

const mockUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;

function mockSession(overrides: Partial<ReturnType<typeof useAuthSession>> = {}) {
  mockUseAuthSession.mockReturnValue({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    signingIn: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    ...overrides,
  } as any);
}

describe('SignInScreen', () => {
  it('renders app name and sign-in button', () => {
    mockSession();
    render(<SignInScreen />);
    expect(screen.getByText('Streetrack')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('calls signIn when button is pressed', () => {
    const signIn = jest.fn();
    mockSession({ signIn });
    render(<SignInScreen />);
    fireEvent.press(screen.getByText('Sign in'));
    expect(signIn).toHaveBeenCalled();
  });

  it('hides sign-in text and shows spinner while signing in', () => {
    mockSession({ signingIn: true });
    render(<SignInScreen />);
    expect(screen.queryByText('Sign in')).toBeNull();
  });

  it('shows error message when signIn fails', () => {
    mockSession({ error: new Error('Auth0 unavailable') });
    render(<SignInScreen />);
    expect(screen.getByText("Couldn't sign in. Try again.")).toBeTruthy();
    expect(screen.getByText('Auth0 unavailable')).toBeTruthy();
  });
});
