'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useGetAdminInquiriesQuery,
  useGetAdminInquiryQuery,
  useUpdateInquiryStatusMutation,
} from '@/store/api/inquiryApi';
import { formatRelativeTime } from '@/lib/utils';
import type { InquiryStatus, QualificationType } from '@/types/inquiry';
import InquiryKanban from '@/components/admin/InquiryKanban';
import DocumentPanel from '@/components/admin/DocumentPanel';

const STATUS_TABS: { value: '' | InquiryStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'inspection_scheduled', label: 'Inspection' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'closed_won', label: 'Won' },
  { value: 'closed_lost', label: 'Lost' },
];

const ALL_STATUSES: { value: InquiryStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'agreement_signed', label: 'Agreement Signed' },
  { value: 'inspection_scheduled', label: 'Inspection Scheduled' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'offer_made', label: 'Offer Made' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
];

const STATUS_COLORS: Record<InquiryStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-sky-100 text-sky-700',
  qualified: 'bg-indigo-100 text-indigo-700',
  agreement_signed: 'bg-violet-100 text-violet-700',
  inspection_scheduled: 'bg-amber-100 text-amber-700',
  negotiating: 'bg-orange-100 text-orange-700',
  offer_made: 'bg-purple-100 text-purple-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700',
};

const STATUS_BORDER: Record<string, string> = {
  new: 'border-l-blue-400',
  contacted: 'border-l-sky-400',
  qualified: 'border-l-indigo-400',
  agreement_signed: 'border-l-violet-400',
  inspection_scheduled: 'border-l-amber-400',
  negotiating: 'border-l-orange-400',
  offer_made: 'border-l-purple-400',
  closed_won: 'border-l-green-500',
  closed_lost: 'border-l-red-400',
};

const QUALIFICATION_OPTIONS: { value: '' | QualificationType; label: string }[] = [
  { value: '', label: 'Not Set' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'not_qualified', label: 'Not Qualified' },
  { value: 'cold', label: 'Cold' },
  { value: 'fake', label: 'Fake' },
];

const QUALIFICATION_COLORS: Record<string, string> = {
  qualified: 'bg-green-100 text-green-700',
  not_qualified: 'bg-yellow-100 text-yellow-700',
  cold: 'bg-slate-100 text-slate-700',
  fake: 'bg-red-100 text-red-700',
};

const TIMELINE_LABELS: Record<string, string> = {
  immediately: 'Immediately',
  '1_3_months': '1-3 months',
  '3_6_months': '3-6 months',
  '6_12_months': '6-12 months',
  just_browsing: 'Just browsing',
};

export default function AdminInquiriesPage() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'' | InquiryStatus>('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<InquiryStatus>('new');
  const [newQualification, setNewQualification] = useState<'' | QualificationType>('');
  const [staffNotes, setStaffNotes] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionTime, setInspectionTime] = useState('');
  const [inspectionLocation, setInspectionLocation] = useState('');

  const { data, isLoading } = useGetAdminInquiriesQuery({
    page,
    per_page: 20,
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const { data: detailData } = useGetAdminInquiryQuery(detailId!, { skip: !detailId });
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateInquiryStatusMutation();


  const inquiries = data?.data || [];
  const meta = data?.meta;
  const detail = detailData?.data;

  const handleStatusUpdate = async (id: string) => {
    try {
      await updateStatus({
        id,
        status: newStatus,
        qualification: newQualification || null,
        ...(staffNotes ? { staff_notes: staffNotes } : {}),
        ...(inspectionDate ? { inspection_date: inspectionDate } : {}),
        ...(inspectionTime ? { inspection_time: inspectionTime } : {}),
        ...(inspectionLocation ? { inspection_location: inspectionLocation } : {}),
      }).unwrap();
      setEditingStatus(null);
      setStaffNotes('');
      setInspectionDate('');
      setInspectionTime('');
      setInspectionLocation('');
    } catch { /* RTK handles */ }
  };

  const openDetail = (id: string) => {
    setDetailId(id);
  };

  return (
    <div className="space-y-6">

      {/* Gradient Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Inquiry Pipeline</h1>
            </div>
            <p className="text-white/60 text-sm">
              {meta ? `${meta.total} total inquiries` : 'Manage and track all property inquiries'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}
                title="Kanban board"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" /></svg>
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                List
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-4 w-28 h-28 rounded-full bg-white/5" />
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <InquiryKanban onCardClick={(inq) => setDetailId(inq.id)} />
      ) : (
      <>

      {/* Segmented Status Filter Tabs */}
      <div className="bg-surface border border-border rounded-xl p-1 flex flex-wrap gap-0.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:bg-background'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-border/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border/50 rounded w-1/3" />
                  <div className="h-3 bg-border/50 rounded w-1/4" />
                </div>
                <div className="h-6 bg-border/50 rounded-full w-16" />
              </div>
              <div className="h-3 bg-border/50 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <h3 className="font-semibold text-text-primary mb-1">No inquiries found</h3>
          <p className="text-sm text-text-muted">No inquiries match the current filter. Try selecting a different status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className={`bg-surface border border-border rounded-xl p-4 space-y-2 border-l-4 hover:border-accent-dark/20 transition-colors ${STATUS_BORDER[inq.status] || 'border-l-border'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Contact type icon */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <p className="font-medium text-text-primary">{inq.full_name || 'Unknown'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[inq.status]}`}>
                      {inq.status.replace(/_/g, ' ')}
                    </span>
                    {inq.qualification && (
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${QUALIFICATION_COLORS[inq.qualification] || ''}`}>
                        {inq.qualification.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted ml-10">
                    {inq.phone && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        {inq.phone}
                      </span>
                    )}
                    {inq.email && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        {inq.email}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-text-muted ml-10">
                    {inq.property && (
                      <span className="flex items-center gap-1 font-medium text-text-secondary truncate max-w-[200px]">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                        {inq.property.title} — {inq.property.formatted_price}
                      </span>
                    )}
                    {inq.budget_range && <span>Budget: {inq.budget_range}</span>}
                    {inq.timeline && <span>{TIMELINE_LABELS[inq.timeline] || inq.timeline}</span>}
                    {inq.financing_type && <span className="capitalize">{inq.financing_type}</span>}
                    {inq.assigned_to && <span>Staff: {inq.assigned_to.full_name}</span>}
                    <span>{formatRelativeTime(inq.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openDetail(inq.id)}
                    className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setEditingStatus(editingStatus === inq.id ? null : inq.id);
                      setNewStatus(inq.status);
                      setNewQualification((inq.qualification as QualificationType) || '');
                      setStaffNotes('');
                    }}
                    className="text-xs bg-accent-dark/10 text-accent-dark hover:bg-accent-dark/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Status
                  </button>
                </div>
              </div>

              {/* Inline status change */}
              {editingStatus === inq.id && (
                <div className="pt-3 border-t border-border space-y-2 ml-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as InquiryStatus)}
                      className="px-3 py-1.5 border border-border rounded-lg bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <select
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value as '' | QualificationType)}
                      className="px-3 py-1.5 border border-border rounded-lg bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {QUALIFICATION_OPTIONS.map((q) => (
                        <option key={q.value} value={q.value}>{q.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleStatusUpdate(inq.id)}
                      disabled={updatingStatus}
                      className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => setEditingStatus(null)}
                      className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-background transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    value={staffNotes}
                    onChange={(e) => setStaffNotes(e.target.value)}
                    placeholder="Staff notes (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {newStatus === 'inspection_scheduled' && (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="date"
                        value={inspectionDate}
                        onChange={(e) => setInspectionDate(e.target.value)}
                        className="px-3 py-1.5 border border-border rounded-lg bg-background text-text-primary text-sm"
                        placeholder="Viewing date"
                      />
                      <input
                        type="time"
                        value={inspectionTime}
                        onChange={(e) => setInspectionTime(e.target.value)}
                        className="px-3 py-1.5 border border-border rounded-lg bg-background text-text-primary text-sm"
                        placeholder="Time"
                      />
                      <input
                        type="text"
                        value={inspectionLocation}
                        onChange={(e) => setInspectionLocation(e.target.value)}
                        className="px-3 py-1.5 border border-border rounded-lg bg-background text-text-primary text-sm"
                        placeholder="Meeting location"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-text-muted">Page {meta.current_page} of {meta.last_page} ({meta.total} total)</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-background transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(meta.last_page, page + 1))}
                  disabled={page === meta.last_page}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-background transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      </>
      )}

      {/* Detail Modal */}
      {detailId && detail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailId(null)}>
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-text-primary">Inquiry Detail</h2>
              </div>
              <button
                onClick={() => setDetailId(null)}
                className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-border/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              {/* Status + qualification badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${STATUS_COLORS[detail.status]}`}>
                  {detail.status.replace(/_/g, ' ')}
                </span>
                {detail.qualification && (
                  <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${QUALIFICATION_COLORS[detail.qualification] || ''}`}>
                    {detail.qualification.replace(/_/g, ' ')}
                  </span>
                )}
                {detail.assigned_to && (
                  <span className="text-xs text-text-muted bg-background px-2.5 py-1 rounded-full">Assigned: {detail.assigned_to.full_name}</span>
                )}
              </div>

              {/* Buyer info */}
              <div>
                <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  Buyer Information
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-text-muted">Name:</span> <span className="text-text-primary">{detail.full_name}</span></div>
                  <div><span className="text-text-muted">Phone:</span> <a href={`tel:${detail.phone}`} className="text-primary hover:underline">{detail.phone}</a></div>
                  <div><span className="text-text-muted">Email:</span> <a href={`mailto:${detail.email}`} className="text-primary hover:underline">{detail.email}</a></div>
                  {detail.user && <div><span className="text-text-muted">Account:</span> <span className="text-text-primary">{detail.user.full_name}</span></div>}
                </div>
              </div>

              {/* Property info */}
              {detail.property && (
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                    Property
                  </p>
                  <div className="bg-background rounded-xl p-3 text-sm">
                    <Link href={`/properties/${detail.property.slug}`} className="text-primary hover:underline font-medium">
                      {detail.property.title}
                    </Link>
                    <p className="text-text-muted">{detail.property.formatted_price}</p>
                  </div>
                </div>
              )}

              {/* Agent info */}
              {detail.agent && (
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                    Agent
                  </p>
                  <div className="text-sm">
                    <span className="text-text-primary">{detail.agent.company_name}</span>
                    {detail.agent.user_name && <span className="text-text-muted"> ({detail.agent.user_name})</span>}
                  </div>
                </div>
              )}

              {/* Inquiry details */}
              <div>
                <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                  Inquiry Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {detail.budget_range && <div><span className="text-text-muted">Budget:</span> <span className="text-text-primary">{detail.budget_range}</span></div>}
                  {detail.timeline && <div><span className="text-text-muted">Timeline:</span> <span className="text-text-primary">{TIMELINE_LABELS[detail.timeline] || detail.timeline}</span></div>}
                  {detail.financing_type && <div><span className="text-text-muted">Financing:</span> <span className="text-text-primary capitalize">{detail.financing_type}</span></div>}
                  {detail.tracking_ref && <div><span className="text-text-muted">Tracking Ref:</span> <span className="text-text-primary font-mono">{detail.tracking_ref}</span></div>}
                  {detail.qualified_at && <div><span className="text-text-muted">Qualified:</span> <span className="text-text-primary">{new Date(detail.qualified_at).toLocaleDateString()}</span></div>}
                  {detail.inspection_at && <div><span className="text-text-muted">Inspection:</span> <span className="text-text-primary">{new Date(detail.inspection_at).toLocaleDateString()}</span></div>}
                  {detail.closed_at && <div><span className="text-text-muted">Closed:</span> <span className="text-text-primary">{new Date(detail.closed_at).toLocaleDateString()}</span></div>}
                </div>
              </div>

              {/* Inspection scheduling */}
              {(detail.inspection_date || detail.status === 'inspection_scheduled' || detail.status === 'qualified' || detail.status === 'agreement_signed') && (
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                    Viewing Details
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detail.inspection_date && <div><span className="text-text-muted">Date:</span> <span className="text-text-primary">{new Date(detail.inspection_date).toLocaleDateString()}</span></div>}
                    {detail.inspection_time && <div><span className="text-text-muted">Time:</span> <span className="text-text-primary">{detail.inspection_time}</span></div>}
                    {detail.inspection_location && <div className="col-span-2"><span className="text-text-muted">Location:</span> <span className="text-text-primary">{detail.inspection_location}</span></div>}
                    {detail.inspection_notes && <div className="col-span-2"><span className="text-text-muted">Notes:</span> <span className="text-text-primary">{detail.inspection_notes}</span></div>}
                  </div>
                </div>
              )}

              {/* Agreement status */}
              {detail.agreement_accepted_at && (
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-2">Buyer Agreement</p>
                  <div className="flex items-center gap-2 text-sm text-success bg-success/10 p-3 rounded-xl">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Digitally accepted on {new Date(detail.agreement_accepted_at).toLocaleDateString()} (v{detail.agreement_terms_version})
                  </div>
                  {detail.agreement_ip && <p className="text-xs text-text-muted mt-1">IP: {detail.agreement_ip}</p>}
                </div>
              )}

              {/* Message */}
              {detail.message && (
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Buyer Message</p>
                  <p className="text-sm text-text-secondary bg-background rounded-xl p-3">{detail.message}</p>
                </div>
              )}

              {/* Staff notes */}
              {detail.staff_notes && (
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Staff Notes</p>
                  <p className="text-sm text-text-secondary bg-amber-50 border border-amber-100 rounded-xl p-3">{detail.staff_notes}</p>
                </div>
              )}

              {/* Documents */}
              <div className="pt-3 border-t border-border">
                <DocumentPanel leadId={detail.id} />
              </div>

              {/* Quick actions */}
              <div className="pt-3 border-t border-border">
                <p className="text-sm font-semibold text-text-primary mb-3">Update Status</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    defaultValue={detail.status}
                    id="detail-status-select"
                    className="px-3 py-2 border border-border rounded-xl bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    defaultValue={detail.qualification || ''}
                    id="detail-qualification-select"
                    className="px-3 py-2 border border-border rounded-xl bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {QUALIFICATION_OPTIONS.map((q) => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      const statusSelect = document.getElementById('detail-status-select') as HTMLSelectElement;
                      const qualSelect = document.getElementById('detail-qualification-select') as HTMLSelectElement;
                      try {
                        await updateStatus({
                          id: detail.id,
                          status: statusSelect.value,
                          qualification: qualSelect.value || null,
                        }).unwrap();
                      } catch { /* handled */ }
                    }}
                    disabled={updatingStatus}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
