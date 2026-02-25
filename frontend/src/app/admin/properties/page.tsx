'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetAdminPropertiesQuery, useApprovePropertyMutation, useRejectPropertyMutation, useDeletePropertyMutation } from '@/store/api/adminApi';
import { PropertyStatusBadge, VerificationBadge } from '@/components/dashboard/StatusBadge';
import { formatPrice, formatDate } from '@/lib/utils';
import type { PropertyStatus } from '@/types';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Property Management</h1>
        {selectedIds.size > 0 && statusFilter === 'pending' && (
          <button onClick={handleBulkApprove} disabled={approving} className="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            Approve Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); setSelectedIds(new Set()); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse flex gap-4">
              <div className="w-24 h-18 bg-border/50 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-border/50 rounded w-1/2" /><div className="h-3 bg-border/50 rounded w-1/3" /></div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <p className="text-text-muted">No properties match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <div key={property.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex gap-4">
                {/* Checkbox for pending */}
                {statusFilter === 'pending' && (
                  <label className="flex items-start pt-1">
                    <input type="checkbox" checked={selectedIds.has(property.id)} onChange={() => toggleSelect(property.id)} className="w-4 h-4" />
                  </label>
                )}

                {/* Cover Image */}
                <div className="w-24 h-18 rounded-lg bg-border/50 overflow-hidden shrink-0">
                  {property.cover_image?.thumbnail_url && (
                    <img src={property.cover_image.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/properties/${property.slug}`} target="_blank" className="text-text-primary font-medium hover:text-accent-dark truncate block">
                        {property.title}
                      </Link>
                      <p className="text-sm text-text-muted mt-0.5">
                        {formatPrice(property.price_kobo)} &middot; {property.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <PropertyStatusBadge status={property.status} />
                        {property.fraud_score !== undefined && property.fraud_score !== null && property.fraud_score > 0 && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            property.fraud_score <= 30
                              ? 'bg-success/10 text-success'
                              : property.fraud_score <= 60
                              ? 'bg-accent/15 text-accent-dark'
                              : 'bg-error/10 text-error'
                          }`}>
                            Risk: {property.fraud_score}%
                          </span>
                        )}
                        {property.agent_detail && (
                          <span className="text-xs text-text-muted">
                            by {property.agent_detail.company_name}
                            {property.agent_detail.verification_status === 'verified' && (
                              <span className="text-success ml-1">&#10003;</span>
                            )}
                          </span>
                        )}
                      </div>
                      {property.rejection_reason && (
                        <p className="text-xs text-error mt-1">Reason: {property.rejection_reason}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {property.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(property.id)}
                            disabled={approving}
                            className="text-xs bg-success hover:bg-success/90 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal(property.id)}
                            className="text-xs bg-surface border border-error text-error px-3 py-1.5 rounded-lg font-medium hover:bg-error/5"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <Link href={`/properties/${property.slug}`} target="_blank" className="text-xs text-text-muted hover:text-text-primary px-2 py-1">
                        Preview
                      </Link>
                      <button
                        onClick={() => setDeleteModal(property.id)}
                        className="text-xs text-error/60 hover:text-error px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-text-muted">Page {meta.current_page} of {meta.last_page} ({meta.total} total)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg border border-border text-xs disabled:opacity-40">Previous</button>
                <button onClick={() => setPage(Math.min(meta.last_page, page + 1))} disabled={page === meta.last_page} className="px-3 py-1 rounded-lg border border-border text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full border border-border">
            <h3 className="font-semibold text-text-primary mb-4">Reject Property</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)..."
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-text-primary text-sm mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 rounded-xl border border-border text-sm text-text-secondary">Cancel</button>
              <button onClick={handleReject} disabled={rejecting || !rejectReason.trim()} className="px-4 py-2 rounded-xl bg-error text-white text-sm font-medium disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full border border-border">
            <h3 className="font-semibold text-text-primary mb-2">Delete Property</h3>
            <p className="text-sm text-text-muted mb-6">
              This will permanently remove this property and all its images. The agent will be notified. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 rounded-xl border border-border text-sm text-text-secondary">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-xl bg-error text-white text-sm font-medium disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
