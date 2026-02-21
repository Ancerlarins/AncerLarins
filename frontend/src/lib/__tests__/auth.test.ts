import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

import Cookies from 'js-cookie';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isAuthenticated } from '../auth';

describe('auth token management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAccessToken reads from cookies', () => {
    vi.mocked(Cookies.get).mockReturnValue('test-access-token' as never);
    expect(getAccessToken()).toBe('test-access-token');
    expect(Cookies.get).toHaveBeenCalledWith('access_token');
  });

  it('getRefreshToken reads from cookies', () => {
    vi.mocked(Cookies.get).mockReturnValue('test-refresh-token' as never);
    expect(getRefreshToken()).toBe('test-refresh-token');
    expect(Cookies.get).toHaveBeenCalledWith('refresh_token');
  });

  it('setTokens stores both tokens with correct options', () => {
    setTokens('access-123', 'refresh-456');
    expect(Cookies.set).toHaveBeenCalledWith('access_token', 'access-123', { expires: 1, sameSite: 'lax' });
    expect(Cookies.set).toHaveBeenCalledWith('refresh_token', 'refresh-456', { expires: 30, sameSite: 'lax' });
  });

  it('clearTokens removes both tokens', () => {
    clearTokens();
    expect(Cookies.remove).toHaveBeenCalledWith('access_token');
    expect(Cookies.remove).toHaveBeenCalledWith('refresh_token');
  });

  it('isAuthenticated returns true when access token exists', () => {
    vi.mocked(Cookies.get).mockReturnValue('some-token' as never);
    expect(isAuthenticated()).toBe(true);
  });

  it('isAuthenticated returns false when no token', () => {
    vi.mocked(Cookies.get).mockReturnValue(undefined as never);
    expect(isAuthenticated()).toBe(false);
  });
});
