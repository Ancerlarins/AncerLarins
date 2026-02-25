import { describe, it, expect, beforeEach } from 'vitest';
import { isAuthenticated, clearAuthIndicator } from '../auth';

describe('auth indicator (httpOnly cookie-based auth)', () => {
  beforeEach(() => {
    // Reset document.cookie between tests
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('isAuthenticated returns true when is_logged_in cookie exists', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'is_logged_in=1; other=abc',
    });
    expect(isAuthenticated()).toBe(true);
  });

  it('isAuthenticated returns false when no indicator cookie', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'other=abc',
    });
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns false when cookie string is empty', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
    expect(isAuthenticated()).toBe(false);
  });

  it('clearAuthIndicator sets an expired cookie', () => {
    clearAuthIndicator();
    expect(document.cookie).toContain('is_logged_in=');
    expect(document.cookie).toContain('expires=Thu, 01 Jan 1970');
  });
});
