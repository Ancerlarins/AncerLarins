import { baseApi } from './baseApi';
import type {
  ApiResponse,
  LocationState,
  LocationCity,
  LocationArea,
  AreaInsights,
  AreaTrendsResponse,
} from '@/types';
import type { PropertyType, ListingType } from '@/types';

export const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStates: builder.query<ApiResponse<LocationState[]>, void>({
      query: () => '/locations/states',
      keepUnusedDataFor: 300,
    }),

    getCities: builder.query<ApiResponse<LocationCity[]>, string>({
      query: (stateId) => `/locations/states/${stateId}/cities`,
      keepUnusedDataFor: 300,
    }),

    getAreas: builder.query<ApiResponse<LocationArea[]>, string>({
      query: (cityId) => `/locations/cities/${cityId}/areas`,
      keepUnusedDataFor: 300,
    }),

    getPropertyTypes: builder.query<ApiResponse<PropertyType[]>, void>({
      query: () => '/property-types',
      keepUnusedDataFor: 300,
    }),

    getAreaInsights: builder.query<ApiResponse<AreaInsights>, string>({
      query: (areaId) => `/areas/${areaId}/insights`,
      keepUnusedDataFor: 120,
    }),

    getAreaTrends: builder.query<ApiResponse<AreaTrendsResponse>, { areaId: string; listingType: ListingType }>({
      query: ({ areaId, listingType }) => `/areas/${areaId}/trends?listing_type=${listingType}`,
      keepUnusedDataFor: 120,
    }),

    submitAreaReview: builder.mutation<ApiResponse<{ id: string }>, {
      areaId: string;
      overall: number;
      safety: number;
      transport: number;
      amenities: number;
      noise: number;
      comment?: string;
      lived_duration?: string;
    }>({
      query: ({ areaId, ...body }) => ({
        url: `/areas/${areaId}/reviews`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetStatesQuery,
  useGetCitiesQuery,
  useGetAreasQuery,
  useGetPropertyTypesQuery,
  useGetAreaInsightsQuery,
  useGetAreaTrendsQuery,
  useSubmitAreaReviewMutation,
} = locationApi;
