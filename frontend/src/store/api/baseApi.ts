import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_URL } from '@/lib/constants';
import { clearAuthIndicator } from '@/lib/auth';

/**
 * Tokens are stored as httpOnly cookies by the backend.
 * We send `credentials: 'include'` so the browser attaches them automatically.
 * No manual Authorization header needed.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json');
    return headers;
  },
});

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Prevent multiple concurrent refresh attempts
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = (async () => {
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions
        );
        return !!refreshResult.data;
      })();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      // Retry the original request — new cookies are set by the refresh response
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      clearAuthIndicator();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Property', 'Agent', 'User', 'Notification', 'SavedProperty', 'SavedSearch', 'Lead', 'Subscription', 'ScrapedListing', 'BlogPost', 'PropertyRequest', 'Estate', 'Cooperative', 'Inquiry', 'Document', 'Commission'],
  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
