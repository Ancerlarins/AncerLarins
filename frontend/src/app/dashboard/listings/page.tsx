'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGetMyListingsQuery } from '@/store/api/agentApi';
import { useDeletePropertyMutation } from '@/store/api/propertyApi';
import { PropertyStatusBadge } from '@/components/dashboard/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';


const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'draft', label: 'Draft' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'rented', label: 'Rented' },
  { value: 'sold', label: 'Sold' },
];

export default function MyListingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMyListingsQuery({
    status: statusFilter || undefined,
    page,
    per_page: 20,
  });
  const [deleteProperty] = useDeletePropertyMutation();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const properties = data?.data || [];
  const meta = data?.meta;

  const totalCount = meta?.total ?? properties.length;
  const activeCount = properties.filter((p) => p.status === 'approved').length;
  const pendingCount = properties.filter((p) => p.status === 'pending').length;
  const draftCount = properties.filter((p) => p.status === 'draft').length;

  const handleDelete = async (id: string) => {
    try {
      await deleteProperty(id).unwrap();
      setDeleteConfirm(null);
    } catch { /* handled by RTK */ }
  };

  const statCards = [
    {
      label: 'Total Listings',
      value: totalCount,
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      ),
      bg: 'bg-primary/10',
    },
    {
      label: 'Active',
      value: activeCount,
      icon: (
        <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      bg: 'bg-success/10',
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: (
        <svg className="w-5 h-5 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      bg: 'bg-accent/10',
    },
    {
      label: 'Draft',
      value: draftCount,
      icon: (
        <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      ),
      bg: 'bg-border/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">My Listings</h1>
            <p className="text-sm text-text-muted">{totalCount} total propert{totalCount !== 1 ? 'ies' : 'y'}</p>
          </div>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-primary px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Listing
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface border border-border rounded-xl p-4 hover:border-accent-dark/20 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{card.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Segmented Tabs */}
      <div className="bg-surface border border-border rounded-xl p-1 inline-flex gap-1 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-background/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        /* Skeleton matching table shape */
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex gap-4">
            {['w-1/4', 'w-1/6', 'w-1/6', 'w-1/6', 'w-1/6', 'w-1/6'].map((w, i) => (
              <div key={i} className={`h-3 bg-border/40 rounded ${w}`} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-border/50 flex items-center gap-4 animate-pulse">
              <div className="w-14 h-10 rounded-lg bg-border/40 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-border/40 rounded w-1/3" />
                <div className="h-2.5 bg-border/30 rounded w-1/5" />
              </div>
              <div className="h-4 bg-border/40 rounded w-20 hidden sm:block" />
              <div className="h-5 bg-border/40 rounded-full w-16" />
              <div className="h-3 bg-border/40 rounded w-10 hidden md:block" />
              <div className="h-3 bg-border/40 rounded w-10 hidden md:block" />
              <div className="h-3 bg-border/40 rounded w-20 hidden lg:block" />
              <div className="h-6 bg-border/40 rounded w-16" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-surface border border-border rounded-2xl">
          <div className="w-16 h-16 bg-border/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            {statusFilter ? 'No listings found' : 'No listings yet'}
          </h3>
          <p className="text-sm text-text-muted mb-5">
            {statusFilter ? 'No listings match the current filter.' : 'Create your first property listing to get started.'}
          </p>
          {!statusFilter && (
            <Link
              href="/dashboard/listings/new"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-primary px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Listing
            </Link>
          )}
        </div>
      ) : (
        /* Enhanced Table */
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/30">
                  <th className="text-left px-4 py-3 font-medium text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                      </svg>
                      Property
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Price
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                      Status
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      Views
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                      </svg>
                      Leads
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted hidden lg:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      Created
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg bg-border/50 overflow-hidden shrink-0 ring-2 ring-border">
                          {p.cover_image?.thumbnail_url && (
                            <Image src={p.cover_image.thumbnail_url} alt={p.title} width={56} height={40} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/properties/${p.slug}`} className="text-text-primary font-medium hover:text-accent-dark truncate block">
                            {p.title}
                          </Link>
                          <p className="text-xs text-text-muted truncate">{p.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-primary font-medium hidden sm:table-cell whitespace-nowrap">
                      {formatPrice(p.price_kobo)}
                    </td>
                    <td className="px-4 py-3">
                      <PropertyStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden md:table-cell">
                      {(p.views_count ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden md:table-cell">
                      {p.leads_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-text-muted text-xs hidden lg:table-cell whitespace-nowrap">
                      {p.created_at ? formatDate(p.created_at) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/listings/${p.id}/edit`}
                          className="text-xs text-text-secondary hover:text-accent-dark hover:bg-accent/10 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="text-xs text-text-muted hover:text-error hover:bg-error/10 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-border">
            {/* Centered trash icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
            </div>
            <h3 className="font-semibold text-text-primary text-center text-lg mb-1">Delete Listing</h3>
            <p className="text-sm text-text-muted text-center mb-4">Are you sure you want to delete this listing? This action cannot be undone.</p>

            {/* Warning callout */}
            <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 mb-5">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-error shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p className="text-xs text-error/80">The listing, all associated images, and lead data will be permanently removed.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="w-full px-4 py-2.5 rounded-xl bg-error text-white text-sm font-medium hover:bg-error/90 transition-colors"
              >
                Delete Listing
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-background/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
