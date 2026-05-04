import { renderHook, act } from '@testing-library/react-native';

jest.mock('react-native-auth0', () => {
  const MockWebAuthError = class extends Error {
    type: string;
    constructor(type: string, message: string) {
      super(message);
      this.type = type;
    }
  };
  return {
    useAuth0: jest.fn(),
    WebAuthError: MockWebAuthError,
    WebAuthErrorCodes: {
      USER_CANCELLED: 'USER_CANCELLED',
      BROWSER_TERMINATED: 'BROWSER_TERMINATED',
    },
  };
});

import { useAuth0 } from 'react-native-auth0';
import { useAuthSession } from './useAuthSession';

const mockAuthorize = jest.fn();
const mockClearSession = jest.fn();

beforeEach(() => {
  (useAuth0 as jest.Mock).mockReturnValue({
    user: null,
    isLoading: false,
    authorize: mockAuthorize,
    clearSession: mockClearSession,
  });
  mockAuthorize.mockClear();
  mockClearSession.mockClear();
});

describe('useAuthSession', () => {
  it('returns isAuthenticated: false when user is null', () => {
    const { result } = renderHook(() => useAuthSession());
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('returns isAuthenticated: true when Auth0 has a user', () => {
    (useAuth0 as jest.Mock).mockReturnValue({
      user: { name: 'Test User' },
      isLoading: false,
      authorize: mockAuthorize,
      clearSession: mockClearSession,
    });
    const { result } = renderHook(() => useAuthSession());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ name: 'Test User' });
  });

  it('signIn calls authorize with correct scope and audience', async () => {
    mockAuthorize.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuthSession());
    await act(() => result.current.signIn());
    expect(mockAuthorize).toHaveBeenCalledWith({
      audience: 'https://test-audience',
      scope: 'openid profile email offline_access',
    });
  });

  it('signOut calls clearSession', async () => {
    mockClearSession.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuthSession());
    await act(() => result.current.signOut());
    expect(mockClearSession).toHaveBeenCalled();
  });

  it('sets error when signIn throws an unexpected error', async () => {
    mockAuthorize.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAuthSession());
    await act(() => result.current.signIn());
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('does not set error when user cancels sign-in', async () => {
    const { WebAuthError, WebAuthErrorCodes } = require('react-native-auth0');
    mockAuthorize.mockRejectedValue(
      new WebAuthError(WebAuthErrorCodes.USER_CANCELLED, 'Cancelled'),
    );
    const { result } = renderHook(() => useAuthSession());
    await act(() => result.current.signIn());
    expect(result.current.error).toBeNull();
  });

  it('does not set error when browser is terminated during sign-in', async () => {
    const { WebAuthError, WebAuthErrorCodes } = require('react-native-auth0');
    mockAuthorize.mockRejectedValue(
      new WebAuthError(WebAuthErrorCodes.BROWSER_TERMINATED, 'Terminated'),
    );
    const { result } = renderHook(() => useAuthSession());
    await act(() => result.current.signIn());
    expect(result.current.error).toBeNull();
  });

  it('wraps non-Error thrown values in an Error', async () => {
    mockAuthorize.mockRejectedValue('plain string error');
    const { result } = renderHook(() => useAuthSession());
    await act(() => result.current.signIn());
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('plain string error');
  });
});
