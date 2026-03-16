'use client';

import { type JSX, useState } from 'react';
import {
  useGetAdminCooperativesQuery,
  useGetAdminCooperativeQuery,
  useUpdateCooperativeStatusMutation,
  useDeleteCooperativeMutation,
} from '@/store/api/cooperativeApi';
import { formatDate, formatPrice } from '@/lib/utils';
import type { CooperativeStatus } from '@/types/cooperative';

const STATUS_TABS: { value: '' | CooperativeStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'forming', label: 'Forming' },
  { value: 'active', label: 'Active' },
  { value: 'target_reached', label: 'Target Reached' },
  { value: 'completed', label: 'Completed' },
  { value: 'dissolved', label: 'Dissolved' },
];

const STATUS_COLORS: Record<CooperativeStatus, string> = {
  forming: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  target_reached: 'bg-amber-100 text-amber-700',
  completed: 'bg-purple-100 text-purple-700',
  dissolved: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<CooperativeStatus, JSX.Element> = {
  forming: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  active: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  target_reached: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  ),
  completed: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
  dissolved: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
};

const MEMBER_ROLE_COLORS: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  treasurer: 'bg-accent/15 text-accent-dark',
  member: 'bg-border/50 text-text-secondary',
};

const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-accent/15 text-accent-dark',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminCooperativesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'' | CooperativeStatus>('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusChangeId, setStatusChangeId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<CooperativeStatus>('forming');

  const { data, isLoading } = useGetAdminCooperativesQuery({
    page,
    per_page: 20,
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const { data: detailData } = useGetAdminCooperativeQuery(detailId!, { skip: !detailId });
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateCooperativeStatusMutation();
  const [deleteCooperative] = useDeleteCooperativeMutation();

  const cooperatives = data?.data || [];
  const meta = data?.meta;
  const detail = detailData?.data;

  const handleStatusUpdate = async (id: string) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      setStatusChangeId(null);
    } catch { /* RTK handles */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cooperative?')) return;
    try {
      await deleteCooperative(id).unwrap();
    } catch { /* RTK handles */ }
  };

  const totalCount = meta?.total ?? cooperatives.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Cooperative Management</h1>
          <p className="text-sm text-text-muted">{totalCount} cooperative{totalCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="bg-surface border border-border rounded-xl p-1 inline-flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-background/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        /* Skeleton cards matching real card layout */
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-5 animate-pulse space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-border/40 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-border/40 rounded w-1/3" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-border/40 rounded-full w-16" />
                      <div className="h-5 bg-border/30 rounded w-20" />
                      <div className="h-5 bg-border/30 rounded w-24 hidden sm:block" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="h-8 bg-border/40 rounded-lg w-14" />
                  <div className="h-8 bg-border/40 rounded-lg w-14 hidden sm:block" />
                  <div className="h-8 bg-border/40 rounded-lg w-14 hidden sm:block" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-border/30 rounded-full h-2.5" />
                <div className="h-3 bg-border/30 rounded w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : cooperatives.length === 0 ? (
        /* Enhanced Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-surface border border-border rounded-2xl">
          <div className="w-16 h-16 bg-border/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">No cooperatives found</h3>
          <p className="text-sm text-text-muted">No cooperatives match the current filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cooperatives.map((coop) => (
            <div
              key={coop.id}
              className="bg-surface border border-border rounded-2xl p-5 space-y-4 hover:border-accent-dark/20 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    coop.status === 'forming' ? 'bg-blue-100 text-blue-700' :
                    coop.status === 'active' ? 'bg-green-100 text-green-700' :
                    coop.status === 'target_reached' ? 'bg-amber-100 text-amber-700' :
                    coop.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {STATUS_ICONS[coop.status]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary truncate">{coop.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${STATUS_COLORS[coop.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          coop.status === 'forming' ? 'bg-blue-500' :
                          coop.status === 'active' ? 'bg-green-500' :
                          coop.status === 'target_reached' ? 'bg-amber-500' :
                          coop.status === 'completed' ? 'bg-purple-500' :
                          'bg-red-500'
                        }`} />
                        {coop.status.replace(/_/g, ' ')}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        {coop.member_count} member{coop.member_count !== 1 ? 's' : ''}
                      </span>
                      {coop.area && (
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          {coop.area.name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted hidden sm:inline-flex">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        {formatDate(coop.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setDetailId(coop.id)}
                    className="text-xs text-primary hover:bg-primary/10 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => { setStatusChangeId(statusChangeId === coop.id ? null : coop.id); setNewStatus(coop.status); }}
                    className="text-xs text-accent-dark hover:bg-accent/10 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Status
                  </button>
                  <button
                    onClick={() => handleDelete(coop.id)}
                    className="text-xs text-error hover:bg-error/10 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Progress bar - gold accent */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-border/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-accent-dark h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${coop.progress_percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-text-muted whitespace-nowrap">
                  {formatPrice(coop.total_contributed_kobo)} / {formatPrice(coop.target_amount_kobo)}
                  <span className="ml-1.5 text-accent-dark font-semibold">({coop.progress_percentage}%)</span>
                </span>
              </div>

              {/* Inline status change */}
              {statusChangeId === coop.id && (
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as CooperativeStatus)}
                    className="px-3 py-2 border border-border rounded-xl bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                  >
                    {STATUS_TABS.filter((t) => t.value).map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleStatusUpdate(coop.id)}
                    disabled={updatingStatus}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    onClick={() => setStatusChangeId(null)}
                    className="px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:bg-background/60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-1 pt-4">
              <p className="text-xs text-text-muted">
                Page <span className="font-medium text-text-secondary">{meta.current_page}</span> of <span className="font-medium text-text-secondary">{meta.last_page}</span> ({meta.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-background/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(meta.last_page, page + 1))}
                  disabled={page === meta.last_page}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-background/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailId && detail && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDetailId(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  detail.status === 'forming' ? 'bg-blue-100 text-blue-700' :
                  detail.status === 'active' ? 'bg-green-100 text-green-700' :
                  detail.status === 'target_reached' ? 'bg-amber-100 text-amber-700' :
                  detail.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {STATUS_ICONS[detail.status]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{detail.name}</h2>
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${STATUS_COLORS[detail.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      detail.status === 'forming' ? 'bg-blue-500' :
                      detail.status === 'active' ? 'bg-green-500' :
                      detail.status === 'target_reached' ? 'bg-amber-500' :
                      detail.status === 'completed' ? 'bg-purple-500' :
                      'bg-red-500'
                    }`} />
                    {detail.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailId(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-background transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              {/* Progress Section */}
              <div className="bg-background/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                  <span className="text-sm font-semibold text-text-primary">Funding Progress</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 bg-border/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-accent-dark h-3 rounded-full transition-all duration-500"
                      style={{ width: `${detail.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-accent-dark">{detail.progress_percentage}%</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Contributed: <span className="font-medium text-text-secondary">{formatPrice(detail.total_contributed_kobo)}</span></span>
                  <span>Target: <span className="font-medium text-text-secondary">{formatPrice(detail.target_amount_kobo)}</span></span>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="bg-background/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  <span className="text-sm font-semibold text-text-primary">Details</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <span className="text-text-muted text-xs">Members</span>
                    <p className="text-text-primary font-medium">{detail.member_count}</p>
                  </div>
                  <div>
                    <span className="text-text-muted text-xs">Target</span>
                    <p className="text-text-primary font-medium">{formatPrice(detail.target_amount_kobo)}</p>
                  </div>
                  <div>
                    <span className="text-text-muted text-xs">Contributed</span>
                    <p className="text-text-primary font-medium">{formatPrice(detail.total_contributed_kobo)}</p>
                  </div>
                  {detail.area && (
                    <div>
                      <span className="text-text-muted text-xs">Area</span>
                      <p className="text-text-primary font-medium">{detail.area.name}</p>
                    </div>
                  )}
                  {detail.admin_user && (
                    <div>
                      <span className="text-text-muted text-xs">Admin</span>
                      <p className="text-text-primary font-medium">{detail.admin_user.full_name}</p>
                    </div>
                  )}
                  {detail.start_date && (
                    <div>
                      <span className="text-text-muted text-xs">Start Date</span>
                      <p className="text-text-primary font-medium">{formatDate(detail.start_date)}</p>
                    </div>
                  )}
                  {detail.target_date && (
                    <div>
                      <span className="text-text-muted text-xs">Target Date</span>
                      <p className="text-text-primary font-medium">{formatDate(detail.target_date)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {detail.description && (
                <div className="bg-background/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-sm font-semibold text-text-primary">Description</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{detail.description}</p>
                </div>
              )}

              {/* Members list with avatars */}
              {detail.members && detail.members.length > 0 && (
                <div className="bg-background/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    <span className="text-sm font-semibold text-text-primary">Members ({detail.members.length})</span>
                  </div>
                  <div className="space-y-2">
                    {detail.members.map((member) => {
                      const name = member.user?.full_name || 'Unknown';
                      return (
                        <div key={member.id} className="flex items-center justify-between bg-surface border border-border/50 rounded-xl p-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar with initials */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(name)}`}>
                              {getInitials(name)}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-text-primary">{name}</span>
                              <span className={`ml-2 text-xs font-medium capitalize px-2 py-0.5 rounded-full ${MEMBER_ROLE_COLORS[member.role] || MEMBER_ROLE_COLORS.member}`}>
                                {member.role}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-accent-dark">{formatPrice(member.total_contributed_kobo)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
