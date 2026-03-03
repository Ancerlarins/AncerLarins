'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  useGetAdminInquiriesQuery,
  useUpdateInquiryStatusMutation,
} from '@/store/api/inquiryApi';
import { formatRelativeTime } from '@/lib/utils';
import type { InquiryStatus, InquiryListItem, QualificationType } from '@/types/inquiry';

const COLUMNS: { status: InquiryStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New', color: 'border-blue-400' },
  { status: 'contacted', label: 'Contacted', color: 'border-sky-400' },
  { status: 'qualified', label: 'Qualified', color: 'border-indigo-400' },
  { status: 'agreement_signed', label: 'Agreement', color: 'border-violet-400' },
  { status: 'inspection_scheduled', label: 'Inspection', color: 'border-amber-400' },
  { status: 'negotiating', label: 'Negotiating', color: 'border-orange-400' },
  { status: 'offer_made', label: 'Offer Made', color: 'border-purple-400' },
  { status: 'closed_won', label: 'Won', color: 'border-green-400' },
  { status: 'closed_lost', label: 'Lost', color: 'border-red-400' },
];

const QUALIFICATION_COLORS: Record<string, string> = {
  qualified: 'bg-green-100 text-green-700',
  not_qualified: 'bg-yellow-100 text-yellow-700',
  cold: 'bg-slate-100 text-slate-700',
  fake: 'bg-red-100 text-red-700',
};

interface KanbanCardProps {
  inquiry: InquiryListItem;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: (inquiry: InquiryListItem) => void;
  isUpdating?: boolean;
}

function KanbanCard({ inquiry, onDragStart, onClick, isUpdating }: KanbanCardProps) {
  return (
    <div
      draggable={!isUpdating}
      onDragStart={(e) => onDragStart(e, inquiry.id)}
      onClick={() => onClick(inquiry)}
      className={`bg-background border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-accent/30 transition-colors select-none ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium text-text-primary truncate">{inquiry.full_name || 'Unknown'}</p>
        {inquiry.qualification && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize shrink-0 ml-1 ${QUALIFICATION_COLORS[inquiry.qualification] || ''}`}>
            {inquiry.qualification.replace(/_/g, ' ')}
          </span>
        )}
      </div>
      {inquiry.property && (
        <p className="text-xs text-text-muted truncate mb-1">
          {inquiry.property.title}
        </p>
      )}
      <div className="flex items-center justify-between text-[10px] text-text-muted">
        <span>{inquiry.property?.formatted_price}</span>
        <span>{formatRelativeTime(inquiry.created_at)}</span>
      </div>
      {inquiry.assigned_to && (
        <p className="text-[10px] text-accent mt-1 truncate">{inquiry.assigned_to.full_name}</p>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  column: typeof COLUMNS[0];
  inquiries: InquiryListItem[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (status: InquiryStatus) => void;
  isDragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onCardClick: (inquiry: InquiryListItem) => void;
  updatingId: string | null;
}

function KanbanColumn({ column, inquiries, onDragStart, onDrop, isDragOver, onDragEnter, onDragLeave, onCardClick, updatingId }: KanbanColumnProps) {
  return (
    <div
      className={`flex flex-col min-w-[260px] max-w-[300px] rounded-xl transition-colors ${
        isDragOver ? 'bg-accent/5' : 'bg-surface'
      }`}
      onDragOver={(e) => { e.preventDefault(); onDragEnter(); }}
      onDragEnter={(e) => { e.preventDefault(); onDragEnter(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(column.status); }}
    >
      {/* Column header */}
      <div className={`px-3 py-2.5 border-t-2 ${column.color} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">{column.label}</h3>
          <span className="text-xs text-text-muted bg-background px-1.5 py-0.5 rounded">{inquiries.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
        {inquiries.length === 0 ? (
          <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragOver ? 'border-accent/40 bg-accent/5' : 'border-border'
          }`}>
            <p className="text-xs text-text-muted">Drop here</p>
          </div>
        ) : (
          inquiries.map((inq) => (
            <KanbanCard key={inq.id} inquiry={inq} onDragStart={onDragStart} onClick={onCardClick} isUpdating={updatingId === inq.id} />
          ))
        )}
      </div>
    </div>
  );
}

export default function InquiryKanban({ onCardClick }: { onCardClick: (inquiry: InquiryListItem) => void }) {
  const { data, isLoading } = useGetAdminInquiriesQuery({ per_page: 200 });
  const [updateStatus] = useUpdateInquiryStatusMutation();

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<InquiryStatus | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const inquiries = data?.data || [];

  const groupedByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = inquiries.filter((inq) => inq.status === col.status);
    return acc;
  }, {} as Record<InquiryStatus, InquiryListItem[]>);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag ghost semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      const el = e.currentTarget;
      el.style.opacity = '0.5';
      setTimeout(() => { el.style.opacity = '1'; }, 0);
    }
  }, []);

  const handleDrop = useCallback(async (newStatus: InquiryStatus) => {
    if (!draggedId) return;

    const inquiry = inquiries.find((inq) => inq.id === draggedId);
    if (!inquiry || inquiry.status === newStatus) {
      setDraggedId(null);
      setDragOverColumn(null);
      return;
    }

    setUpdatingId(draggedId);
    try {
      await updateStatus({ id: draggedId, status: newStatus }).unwrap();
    } catch { /* RTK handles */ } finally {
      setUpdatingId(null);
    }

    setDraggedId(null);
    setDragOverColumn(null);
  }, [draggedId, inquiries, updateStatus]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-w-[260px] h-96 bg-surface rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4"
    >
      {COLUMNS.map((col) => (
        <KanbanColumn
          key={col.status}
          column={col}
          inquiries={groupedByStatus[col.status] || []}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          isDragOver={dragOverColumn === col.status}
          onDragEnter={() => setDragOverColumn(col.status)}
          onDragLeave={() => setDragOverColumn((prev) => prev === col.status ? null : prev)}
          onCardClick={onCardClick}
          updatingId={updatingId}
        />
      ))}
    </div>
  );
}
