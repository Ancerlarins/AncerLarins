'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useGetCommissionsQuery,
  useGetRevenueSummaryQuery,
  useCreateCommissionMutation,
  useUpdateCommissionStatusMutation,
} from '@/store/api/commissionApi';
import { formatRelativeTime } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  invoiced: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_BORDER: Record<string, string> = {
  pending: 'border-l-amber-400',
  invoiced: 'border-l-blue-400',
  paid: 'border-l-green-500',
  cancelled: 'border-l-red-400',
};

function formatKobo(kobo: number): string {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ---- Icons ---- */
function CurrencyIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function EarnedIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function DealsWonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function DealsLostIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function FormIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function InvoiceActionIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

function CheckActionIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function CancelActionIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

/* ---- Stat Card ---- */
function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-accent-dark/20 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
          <p className="text-xl font-bold text-text-primary">{value}</p>
          {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminRevenuePage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [leadId, setLeadId] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [rate, setRate] = useState('2.5');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const { data: summary, isLoading: loadingSummary } = useGetRevenueSummaryQuery({ year });
  const { data: commissions, isLoading: loadingCommissions } = useGetCommissionsQuery({
    page,
    per_page: 20,
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const [createCommission, { isLoading: creating }] = useCreateCommissionMutation();
  const [updateStatus] = useUpdateCommissionStatusMutation();


  const summaryData = summary?.data;
  const items = commissions?.data || [];
  const meta = commissions?.meta;

  // Revenue bar chart (simple CSS-based)
  const maxMonthly = summaryData?.monthly_revenue?.reduce((max, m) => Math.max(max, m.total_kobo), 0) || 1;

  const handleCreate = async () => {
    if (!leadId || !salePrice) return;
    const priceKobo = Math.round(parseFloat(salePrice) * 100);
    try {
      await createCommission({
        lead_id: leadId,
        sale_price_kobo: priceKobo,
        commission_rate: parseFloat(rate),
        ...(paymentMethod ? { payment_method: paymentMethod } : {}),
        ...(notes ? { notes } : {}),
      }).unwrap();
      setShowCreate(false);
      setLeadId('');
      setSalePrice('');
      setRate('2.5');
      setPaymentMethod('');
      setNotes('');
    } catch { /* handled */ }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
    } catch { /* handled */ }
  };

  return (
    <div className="space-y-8">

      {/* ---- Gradient Banner ---- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <CurrencyIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Revenue &amp; Commissions</h1>
              <p className="text-white/60 text-sm mt-0.5">Track earnings, invoices, and commission payouts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg bg-white text-primary text-sm font-medium border-0 cursor-pointer focus:ring-2 focus:ring-white/30"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 rounded-lg bg-white text-primary text-sm font-semibold hover:bg-white/90 transition-colors shadow-sm"
            >
              + Record Commission
            </button>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-4 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -left-6 w-20 h-20 rounded-full bg-white/5" />
      </div>

      {/* ---- Summary Stats ---- */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : summaryData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Total Earned"
            value={formatKobo(summaryData.total_earned)}
            sub={`${year}`}
            icon={<EarnedIcon />}
            iconBg="bg-green-100 text-green-600"
          />
          <StatCard
            label="Pending"
            value={formatKobo(summaryData.total_pending)}
            icon={<PendingIcon />}
            iconBg="bg-amber-100 text-amber-600"
          />
          <StatCard
            label="Invoiced"
            value={formatKobo(summaryData.total_invoiced)}
            icon={<InvoiceIcon />}
            iconBg="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="Deals Won"
            value={String(summaryData.deals_won)}
            icon={<DealsWonIcon />}
            iconBg="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            label="Deals Lost"
            value={String(summaryData.deals_lost)}
            icon={<DealsLostIcon />}
            iconBg="bg-red-100 text-red-500"
          />
        </div>
      )}

      {/* ---- Monthly Revenue Bar Chart ---- */}
      {summaryData && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ChartIcon />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">Monthly Revenue &mdash; {year}</h2>
          </div>
          <div className="flex items-end gap-2 h-40">
            {summaryData.monthly_revenue.map((m) => {
              const barH = Math.max((m.total_kobo / maxMonthly) * 120, 4);
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full relative flex justify-center">
                    {m.total_kobo > 0 && (
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium text-text-primary bg-surface border border-border rounded px-1.5 py-0.5 shadow-sm whitespace-nowrap">
                        {formatKobo(m.total_kobo)}
                      </div>
                    )}
                    <div
                      className="w-full max-w-[40px] bg-gradient-to-t from-accent-dark to-accent rounded-t transition-all duration-500"
                      style={{ height: `${barH}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted font-medium">{MONTHS[m.month - 1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- Create Commission Form ---- */}
      {showCreate && (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FormIcon />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">Record New Commission</h2>
          </div>

          {/* Deal Information */}
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Deal Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Lead ID</label>
                <input
                  type="text"
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  placeholder="Enter Lead UUID"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Sale Price (Naira)</label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="2.5"
                  step="0.5"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Payment Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                >
                  <option value="">Select method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Commission Preview */}
          {salePrice && rate && (
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-4 py-2.5">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                <CurrencyIcon />
              </div>
              <p className="text-sm text-accent font-semibold">
                Commission: {formatKobo(Math.round(parseFloat(salePrice) * 100 * parseFloat(rate) / 100))}
                <span className="font-normal text-accent/70 ml-1">({rate}%)</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={creating || !leadId || !salePrice}
              className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {creating ? 'Saving...' : 'Save Commission'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-5 py-2.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-background transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ---- Commission List ---- */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-text-primary">All Commissions</h2>
          <div className="flex gap-1.5 sm:ml-auto flex-wrap">
            {['', 'pending', 'invoiced', 'paid', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-background border border-border text-text-secondary hover:bg-surface hover:border-accent-dark/20'
                }`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </button>
            ))}
          </div>
        </div>

        {loadingCommissions ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-surface border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Enhanced Empty State */
          <div className="text-center py-16 bg-surface border border-border rounded-xl">
            <div className="w-16 h-16 rounded-full bg-border/30 flex items-center justify-center mx-auto mb-4 text-text-muted">
              <EmptyIcon />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">No commissions found</h3>
            <p className="text-sm text-text-muted max-w-xs mx-auto">
              {statusFilter
                ? `No commissions with "${statusFilter}" status. Try a different filter.`
                : 'Start by recording your first commission using the button above.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <div
                key={c.id}
                className={`bg-surface border border-border border-l-4 ${STATUS_BORDER[c.status] || 'border-l-border'} rounded-xl p-4 hover:border-accent-dark/20 transition-colors`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-accent">{c.formatted_commission}</span>
                      <span className="text-xs text-text-muted">from {c.formatted_sale_price} @ {c.commission_rate}%</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${STATUS_COLORS[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      {c.lead && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" /></svg>
                          {c.lead.full_name}
                        </span>
                      )}
                      {c.property && (
                        <Link href={`/properties/${c.property.slug}`} className="text-primary hover:underline truncate max-w-[200px] flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                          {c.property.title}
                        </Link>
                      )}
                      {c.payment_method && (
                        <span className="capitalize bg-background px-1.5 py-0.5 rounded text-[11px]">{c.payment_method.replace(/_/g, ' ')}</span>
                      )}
                      {c.paid_at && <span>Paid: {new Date(c.paid_at).toLocaleDateString()}</span>}
                      <span>{formatRelativeTime(c.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(c.id, 'invoiced')}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                        title="Mark as Invoiced"
                      >
                        <InvoiceActionIcon />
                        <span className="hidden sm:inline">Invoice</span>
                      </button>
                    )}
                    {c.status === 'invoiced' && (
                      <button
                        onClick={() => handleStatusUpdate(c.id, 'paid')}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors font-medium"
                        title="Mark as Paid"
                      >
                        <CheckActionIcon />
                        <span className="hidden sm:inline">Mark Paid</span>
                      </button>
                    )}
                    {(c.status === 'pending' || c.status === 'invoiced') && (
                      <button
                        onClick={() => handleStatusUpdate(c.id, 'cancelled')}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        title="Cancel Commission"
                      >
                        <CancelActionIcon />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-text-muted">
                  Page <span className="font-medium text-text-secondary">{meta.current_page}</span> of <span className="font-medium text-text-secondary">{meta.last_page}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-surface transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(meta.last_page, page + 1))}
                    disabled={page === meta.last_page}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-surface transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
