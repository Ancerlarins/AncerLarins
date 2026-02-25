import { baseApi } from './baseApi';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { InquiryListItem, InquiryDetail, CreateInquiryPayload, InquiryTrackingResult } from '@/types/inquiry';

export const inquiryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public — guest or authenticated
    submitInquiry: builder.mutation<ApiResponse<{ inquiry_id: string; tracking_ref: string }>, CreateInquiryPayload>({
      query: (body) => ({
        url: '/inquiries',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Inquiry', id: 'ADMIN_LIST' }],
    }),

    // Admin
    getAdminInquiries: builder.query<PaginatedResponse<InquiryListItem>, Record<string, unknown> | void>({
      query: (params) => ({
        url: '/admin/inquiries',
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Inquiry' as const, id })),
              { type: 'Inquiry', id: 'ADMIN_LIST' },
            ]
          : [{ type: 'Inquiry', id: 'ADMIN_LIST' }],
    }),

    getAdminInquiry: builder.query<ApiResponse<InquiryDetail>, string>({
      query: (id) => `/admin/inquiries/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Inquiry', id }],
    }),

    updateInquiryStatus: builder.mutation<ApiResponse<null>, { id: string; status: string; qualification?: string | null; staff_notes?: string; inspection_date?: string; inspection_time?: string; inspection_location?: string }>({
      query: ({ id, ...body }) => ({
        url: `/admin/inquiries/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Inquiry', id },
        { type: 'Inquiry', id: 'ADMIN_LIST' },
      ],
    }),

    assignInquiry: builder.mutation<ApiResponse<null>, { id: string; assigned_to: string }>({
      query: ({ id, assigned_to }) => ({
        url: `/admin/inquiries/${id}/assign`,
        method: 'PUT',
        body: { assigned_to },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Inquiry', id },
        { type: 'Inquiry', id: 'ADMIN_LIST' },
      ],
    }),

    // Public — buyer inquiry tracking
    trackInquiry: builder.mutation<ApiResponse<InquiryTrackingResult>, { ref: string; email: string }>({
      query: (body) => ({
        url: '/inquiries/track',
        method: 'POST',
        body,
      }),
    }),

    // Public — buyer agreement acceptance
    acceptAgreement: builder.mutation<ApiResponse<null>, { ref: string; email: string }>({
      query: (body) => ({
        url: '/inquiries/accept-agreement',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useSubmitInquiryMutation,
  useGetAdminInquiriesQuery,
  useGetAdminInquiryQuery,
  useUpdateInquiryStatusMutation,
  useAssignInquiryMutation,
  useTrackInquiryMutation,
  useAcceptAgreementMutation,
} = inquiryApi;
