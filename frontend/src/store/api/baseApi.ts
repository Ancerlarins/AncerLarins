import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_URL } from '@/lib/constants';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/lib/auth';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { data: { access_token: string; refresh_token: string } };
        setTokens(data.data.access_token, data.data.refresh_token);
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } else {
      clearTokens();
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
  tagTypes: ['Property', 'Agent', 'User', 'Notification', 'SavedProperty', 'SavedSearch', 'Lead', 'Subscription', 'ScrapedListing', 'BlogPost', 'PropertyRequest', 'Estate', 'Cooperative'],
  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
