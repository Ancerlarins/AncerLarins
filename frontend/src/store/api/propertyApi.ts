import { baseApi } from './baseApi';
import type {
  ApiResponse,
  PaginatedResponse,
  PropertyListItem,
  PropertyDetail,
  CreatePropertyPayload,
} from '@/types';

export const propertyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProperties: builder.query<PaginatedResponse<PropertyListItem>, Record<string, unknown> | void>({
      query: (params) => ({
        url: '/properties',
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Property' as const, id })),
              { type: 'Property', id: 'LIST' },
            ]
          : [{ type: 'Property', id: 'LIST' }],
    }),

    getPropertyBySlug: builder.query<ApiResponse<PropertyDetail>, string>({
      query: (slug) => `/properties/${slug}`,
      providesTags: (_result, _err, slug) => [{ type: 'Property', id: slug }],
    }),

    createProperty: builder.mutation<ApiResponse<PropertyDetail>, CreatePropertyPayload>({
      query: (body) => ({ url: '/agent/properties', method: 'POST', body }),
      invalidatesTags: [{ type: 'Property', id: 'LIST' }],
    }),

    updateProperty: builder.mutation<ApiResponse<PropertyDetail>, { id: string; data: Partial<CreatePropertyPayload> }>({
      query: ({ id, data }) => ({ url: `/agent/properties/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Property', id }],
    }),

    deleteProperty: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/agent/properties/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Property', id: 'LIST' }],
    }),

    saveProperty: builder.mutation<ApiResponse<{ saved: boolean }>, string>({
      query: (id) => ({ url: `/properties/${id}/save`, method: 'POST' }),
      invalidatesTags: ['SavedProperty'],
    }),

    contactAgent: builder.mutation<
      ApiResponse<{ lead_id: string; whatsapp_url?: string; phone?: string; avg_response_time?: number | null }>,
      { propertyId: string; contact_type: string; source?: string; utm_campaign?: string }
    >({
      query: ({ propertyId, ...body }) => ({
        url: `/properties/${propertyId}/contact`,
        method: 'POST',
        body,
      }),
    }),

    getSimilarProperties: builder.query<ApiResponse<PropertyListItem[]>, string>({
      query: (id) => `/properties/${id}/similar`,
      keepUnusedDataFor: 120,
    }),
  }),
});

export const {
  useGetPropertiesQuery,
  useGetPropertyBySlugQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useSavePropertyMutation,
  useContactAgentMutation,
  useGetSimilarPropertiesQuery,
} = propertyApi;
