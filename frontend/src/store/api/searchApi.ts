import { baseApi } from './baseApi';
import type {
  PaginatedResponse,
  ApiResponse,
  PropertyListItem,
  SearchFilters,
  SearchSuggestion,
  MapProperty,
  MapBounds,
} from '@/types';

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchProperties: builder.query<PaginatedResponse<PropertyListItem>, SearchFilters>({
      query: (filters) => ({
        url: '/search',
        params: filters,
      }),
    }),

    getSearchSuggestions: builder.query<ApiResponse<SearchSuggestion[]>, string>({
      query: (q) => ({
        url: '/search/suggestions',
        params: { q },
      }),
      keepUnusedDataFor: 300,
    }),

    getMapProperties: builder.query<ApiResponse<MapProperty[]>, MapBounds & Record<string, unknown>>({
      query: (params) => ({
        url: '/search/map',
        params,
      }),
    }),
  }),
});

export const {
  useSearchPropertiesQuery,
  useGetSearchSuggestionsQuery,
  useLazyGetSearchSuggestionsQuery,
  useGetMapPropertiesQuery,
} = searchApi;
