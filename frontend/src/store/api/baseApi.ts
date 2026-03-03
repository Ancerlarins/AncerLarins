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

let refreshPromise: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // All concurrent 401s share the same refresh promise
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const refreshResult = await rawBaseQuery(
            { url: '/auth/refresh', method: 'POST' },
            api,
            extraOptions
          );
          return !!refreshResult.data;
        } catch {
          return false;
        }
      })();
    }

    try {
      const refreshed = await refreshPromise;

      if (refreshed) {
        // Retry the original request — new cookies are set by the refresh response
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        clearAuthIndicator();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } finally {
      // Only the last awaiter clears the promise
      refreshPromise = null;
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
