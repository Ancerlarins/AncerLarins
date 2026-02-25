import { baseApi } from './baseApi';
import type {
  ApiResponse,
  PaginatedResponse,
  AdminProperty,
  AdminAgent,
  AdminDashboardStats,
  Report,
  User,
} from '@/types';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<ApiResponse<AdminDashboardStats>, void>({
      query: () => '/admin/dashboard',
    }),

    // Property management
    getAdminProperties: builder.query<PaginatedResponse<AdminProperty>, Record<string, unknown> | void>({
      query: (params) => ({ url: '/admin/properties', params: params || undefined }),
      providesTags: [{ type: 'Property', id: 'ADMIN_LIST' }],
    }),

    approveProperty: builder.mutation<ApiResponse<unknown>, { property_id: string }>({
      query: (body) => ({ url: '/admin/properties/approve', method: 'POST', body }),
      invalidatesTags: [{ type: 'Property', id: 'LIST' }, { type: 'Property', id: 'ADMIN_LIST' }],
    }),

    rejectProperty: builder.mutation<ApiResponse<unknown>, { property_id: string; rejection_reason: string }>({
      query: (body) => ({ url: '/admin/properties/reject', method: 'POST', body }),
      invalidatesTags: [{ type: 'Property', id: 'LIST' }, { type: 'Property', id: 'ADMIN_LIST' }],
    }),

    deleteProperty: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/properties/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Property', id: 'LIST' }, { type: 'Property', id: 'ADMIN_LIST' }],
    }),

    // Agent management
    getAdminAgents: builder.query<PaginatedResponse<AdminAgent>, Record<string, unknown> | void>({
      query: (params) => ({ url: '/admin/agents', params: params || undefined }),
      providesTags: [{ type: 'Agent', id: 'ADMIN_LIST' }],
    }),

    verifyAgent: builder.mutation<ApiResponse<unknown>, { agent_profile_id: string }>({
      query: (body) => ({ url: '/admin/agents/verify', method: 'POST', body }),
      invalidatesTags: [{ type: 'Agent', id: 'LIST' }, { type: 'Agent', id: 'ADMIN_LIST' }],
    }),

    rejectAgent: builder.mutation<ApiResponse<unknown>, { agent_profile_id: string; rejection_reason: string }>({
      query: (body) => ({ url: '/admin/agents/reject', method: 'POST', body }),
      invalidatesTags: [{ type: 'Agent', id: 'LIST' }, { type: 'Agent', id: 'ADMIN_LIST' }],
    }),

    // User management
    getAdminUsers: builder.query<PaginatedResponse<User>, Record<string, unknown> | void>({
      query: (params) => ({ url: '/admin/users', params: params || undefined }),
      providesTags: [{ type: 'User', id: 'ADMIN_LIST' }],
    }),

    banUser: builder.mutation<ApiResponse<unknown>, { user_id: string; ban_reason: string }>({
      query: (body) => ({ url: '/admin/users/ban', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'ADMIN_LIST' }],
    }),

    unbanUser: builder.mutation<ApiResponse<unknown>, { user_id: string }>({
      query: (body) => ({ url: '/admin/users/unban', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'ADMIN_LIST' }],
    }),

    // Report management
    getAdminReports: builder.query<PaginatedResponse<Report>, Record<string, unknown> | void>({
      query: (params) => ({ url: '/admin/reports', params: params || undefined }),
    }),

    resolveReport: builder.mutation<ApiResponse<unknown>, { id: string; resolution_note: string }>({
      query: ({ id, ...body }) => ({
        url: `/admin/reports/${id}/resolve`,
        method: 'PUT',
        body,
      }),
    }),

    dismissReport: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({
        url: `/admin/reports/${id}/dismiss`,
        method: 'PUT',
      }),
    }),

    // Activity logs
    getActivityLogs: builder.query<PaginatedResponse<{
      id: string;
      user: { id: string; full_name: string; role: string } | null;
      action: string;
      target_type: string | null;
      target_id: string | null;
      metadata: Record<string, unknown>;
      ip_address: string;
      created_at: string;
    }>, Record<string, unknown> | void>({
      query: (params) => ({ url: '/admin/activity-logs', params: params || undefined }),
    }),

    // Scraped listings
    getScrapedListings: builder.query<PaginatedResponse<{
      id: string;
      source: string;
      source_url: string;
      title: string;
      price_kobo: number | null;
      location: string | null;
      bedrooms: number | null;
      property_type: string | null;
      listing_type: string | null;
      image_url: string | null;
      status: string;
      dedup_score: number | null;
      created_at: string;
    }>, Record<string, unknown> | void>({
      query: (params) => ({ url: '/admin/scraped-listings', params: params || undefined }),
      providesTags: ['ScrapedListing'],
    }),

    approveScrapedListing: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: `/admin/scraped-listings/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['ScrapedListing'],
    }),

    rejectScrapedListing: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: `/admin/scraped-listings/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['ScrapedListing'],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminPropertiesQuery,
  useApprovePropertyMutation,
  useRejectPropertyMutation,
  useDeletePropertyMutation,
  useGetAdminAgentsQuery,
  useVerifyAgentMutation,
  useRejectAgentMutation,
  useGetAdminUsersQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useGetAdminReportsQuery,
  useResolveReportMutation,
  useDismissReportMutation,
  useGetActivityLogsQuery,
  useGetScrapedListingsQuery,
  useApproveScrapedListingMutation,
  useRejectScrapedListingMutation,
} = adminApi;
