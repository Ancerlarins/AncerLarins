/**
 * Auth utilities for httpOnly cookie-based authentication.
 *
 * Access and refresh tokens are stored as httpOnly cookies by the backend
 * and are never accessible to JavaScript. The backend also sets a non-httpOnly
 * `is_logged_in` indicator cookie so the frontend can check auth state.
 */

const AUTH_INDICATOR = 'is_logged_in';

export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some(c => c.trim().startsWith(`${AUTH_INDICATOR}=`));
}

export function clearAuthIndicator(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_INDICATOR}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
