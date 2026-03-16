'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGetAdminPropertiesQuery, useApprovePropertyMutation, useRejectPropertyMutation, useDeletePropertyMutation } from '@/store/api/adminApi';
import { PropertyStatusBadge } from '@/components/dashboard/StatusBadge';
import { formatPrice } from '@/lib/utils';

const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: '', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminPropertiesPage() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminPropertiesQuery({
    status: statusFilter || undefined,
    page,
    per_page: 20,
  });
  const [approveProperty, { isLoading: approving }] = useApprovePropertyMutation();
  const [rejectProperty, { isLoading: rejecting }] = useRejectPropertyMutation();
  const [deleteProperty, { isLoading: deleting }] = useDeletePropertyMutation();

  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const properties = data?.data || [];
  const meta = data?.meta;

  const handleApprove = async (propertyId: string) => {
    try {
      await approveProperty({ property_id: propertyId }).unwrap();
    } catch { /* RTK handles */ }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    try {
      await rejectProperty({ property_id: rejectModal, rejection_reason: rejectReason }).unwrap();
      setRejectModal(null);
      setRejectReason('');
    } catch { /* RTK handles */ }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteProperty(deleteModal).unwrap();
      setDeleteModal(null);
    } catch { /* RTK handles */ }
  };

  const handleBulkApprove = async () => {
    for (const id of selectedIds) {
      await approveProperty({ property_id: id }).unwrap();
    }
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  // Compute stat counts
  const totalCount = meta?.total ?? properties.length;
  const pendingCount = properties.filter((p) => p.status === 'pending').length;
  const approvedCount = properties.filter((p) => p.status === 'approved').length;
  const rejectedCount = properties.filter((p) => p.status === 'rejected').length;

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BuildingIcon />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Property Management</h1>
            <p className="text-sm text-text-muted">{totalCount} propert{totalCount === 1 ? 'y' : 'ies'} total</p>
          </div>
        </div>
        {selectedIds.size > 0 && statusFilter === 'pending' && (
          <button
            onClick={handleBulkApprove}
            disabled={approving}
            className="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Approve Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={totalCount} icon={<BuildingIcon />} color="primary" />
        <StatCard label="Pending" value={pendingCount} icon={<ClockIcon />} color="amber" />
        <StatCard label="Approved" value={approvedCount} icon={<CheckCircleIcon />} color="green" />
        <StatCard label="Rejected" value={rejectedCount} icon={<XCircleIcon />} color="red" />
      </div>

      {/* ── Segmented Tab Control ───────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl p-1 inline-flex gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); setSelectedIds(new Set()); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-background'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      {isLoading ? (
        /* Better skeletons matching card layout */
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-[72px] bg-border/40 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-border/40 rounded w-2/5" />
                  <div className="h-3 bg-border/40 rounded w-3/5" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-border/40 rounded-full w-16" />
                    <div className="h-5 bg-border/40 rounded-full w-20" />
                  </div>
                </div>
                <div className="flex items-start gap-2 shrink-0">
                  <div className="h-7 bg-border/40 rounded-lg w-16" />
                  <div className="h-7 bg-border/40 rounded-lg w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        /* Enhanced empty state */
        <div className="text-center py-20 bg-surface border border-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">No properties found</h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto mb-5">
            There are no properties matching the current filter. Try switching to a different tab.
          </p>
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            View All Properties
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => {
            const borderColor =
              property.status === 'approved' ? 'border-l-success' :
              property.status === 'pending' ? 'border-l-accent-dark' :
              property.status === 'rejected' ? 'border-l-error' :
              'border-l-border';

            return (
              <div
                key={property.id}
                className={`bg-surface border border-border rounded-xl p-4 hover:border-accent-dark/20 transition-colors border-l-[3px] ${borderColor}`}
              >
                <div className="flex gap-4">
                  {/* Checkbox for pending */}
                  {statusFilter === 'pending' && (
                    <label className="flex items-start pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(property.id)}
                        onChange={() => toggleSelect(property.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                    </label>
                  )}

                  {/* Cover Image */}
                  <div className="w-24 h-[72px] rounded-lg bg-border/30 overflow-hidden shrink-0">
                    {property.cover_image?.thumbnail_url ? (
                      <Image src={property.cover_image.thumbnail_url} alt={property.title} width={96} height={72} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted/40">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/properties/${property.slug}`} target="_blank" className="text-text-primary font-medium hover:text-accent-dark truncate block transition-colors">
                          {property.title}
                        </Link>
                        <p className="text-sm text-text-muted mt-0.5">
                          {formatPrice(property.price_kobo)} &middot; {property.address}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <PropertyStatusBadge status={property.status} />
                          {property.fraud_score !== undefined && property.fraud_score !== null && property.fraud_score > 0 && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              property.fraud_score <= 30
                                ? 'bg-success/10 text-success'
                                : property.fraud_score <= 60
                                ? 'bg-accent/15 text-accent-dark'
                                : 'bg-error/10 text-error'
                            }`}>
                              {property.fraud_score > 60 && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                              )}
                              Risk: {property.fraud_score}%
                            </span>
                          )}
                          {property.agent_detail && (
                            <span className="text-xs text-text-muted inline-flex items-center gap-1">
                              by {property.agent_detail.company_name}
                              {property.agent_detail.verification_status === 'verified' && (
                                <svg className="w-3.5 h-3.5 text-success" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                        {property.rejection_reason && (
                          <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                            </svg>
                            {property.rejection_reason}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {property.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(property.id)}
                              disabled={approving}
                              className="text-xs bg-success hover:bg-success/90 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal(property.id)}
                              className="text-xs bg-surface border border-error text-error px-3 py-1.5 rounded-lg font-medium hover:bg-error/5 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <Link href={`/properties/${property.slug}`} target="_blank" className="text-xs text-text-muted hover:text-text-primary px-2 py-1.5 rounded-lg hover:bg-background transition-colors">
                          Preview
                        </Link>
                        <button
                          onClick={() => setDeleteModal(property.id)}
                          className="text-xs text-error/60 hover:text-error px-2 py-1.5 rounded-lg hover:bg-error/5 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-text-muted">
                Page {meta.current_page} of {meta.last_page} ({meta.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-1.5 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-background transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(meta.last_page, page + 1))}
                  disabled={page === meta.last_page}
                  className="px-4 py-1.5 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-background transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reject Modal ────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-border">
            {/* Centered warning icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
            <h3 className="font-semibold text-text-primary text-center text-lg mb-1">Reject Property</h3>
            <p className="text-sm text-text-muted text-center mb-5">
              The agent will be notified with your reason for rejection.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)..."
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-text-primary text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors resize-none"
            />
            {/* Warning callout */}
            <div className="bg-error/5 border border-error/10 rounded-lg px-4 py-3 mb-5">
              <p className="text-xs text-error/80">
                This action will change the property status to rejected. The agent can resubmit after addressing the issues.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
                className="w-full py-2.5 rounded-xl bg-error hover:bg-error/90 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {rejecting ? 'Rejecting...' : 'Reject Property'}
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="w-full py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-background transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ────────────────────────────────────── */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-border">
            {/* Centered warning icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
            </div>
            <h3 className="font-semibold text-text-primary text-center text-lg mb-1">Delete Property</h3>
            <p className="text-sm text-text-muted text-center mb-5">
              This will permanently remove this property and all its images.
            </p>
            {/* Warning callout */}
            <div className="bg-error/5 border border-error/10 rounded-lg px-4 py-3 mb-5">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-error shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-error/80">
                  The agent will be notified. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-2.5 rounded-xl bg-error hover:bg-error/90 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete Property'}
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="w-full py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-background transition-colors"
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

// ── Stat Card Component ──────────────────────────────────────

function StatCard({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'amber' | 'green' | 'red';
}) {
  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary' },
    amber: { bg: 'bg-accent-dark/10', text: 'text-accent-dark' },
    green: { bg: 'bg-success/10', text: 'text-success' },
    red: { bg: 'bg-error/10', text: 'text-error' },
  };
  const c = colorMap[color];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 group hover:border-accent-dark/20 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value.toLocaleString()}</p>
      <p className="text-sm text-text-muted mt-0.5">{label}</p>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────

function BuildingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
