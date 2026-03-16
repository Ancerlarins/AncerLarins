'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useGetAdminAgentsQuery, useVerifyAgentMutation, useRejectAgentMutation } from '@/store/api/adminApi';
import { VerificationBadge } from '@/components/dashboard/StatusBadge';


const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminAgentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminAgentsQuery({
    verification_status: statusFilter || undefined,
    page,
    per_page: 20,
  });
  const [verifyAgent] = useVerifyAgentMutation();
  const [rejectAgent] = useRejectAgentMutation();

  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const agents = data?.data || [];
  const meta = data?.meta;

  const totalAgents = meta?.total ?? agents.length;
  const pendingCount = agents.filter((a) => a.verification_status === 'pending').length;
  const verifiedCount = agents.filter((a) => a.verification_status === 'verified').length;

  const handleVerify = async (agentProfileId: string) => {
    try {
      await verifyAgent({ agent_profile_id: agentProfileId }).unwrap();
    } catch { /* RTK */ }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    try {
      await rejectAgent({ agent_profile_id: rejectModal, rejection_reason: rejectReason }).unwrap();
      setRejectModal(null);
      setRejectReason('');
    } catch { /* RTK */ }
  };

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 rounded-lg p-3">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Agent Management</h1>
          <p className="text-sm text-text-muted">{totalAgents} agent{totalAgents !== 1 ? 's' : ''} registered</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border hover:border-accent-dark/20 transition-colors rounded-xl p-4 flex items-center gap-4">
          <div className="bg-primary/10 rounded-lg p-2.5">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{totalAgents}</p>
            <p className="text-xs text-text-muted">Total Agents</p>
          </div>
        </div>
        <div className="bg-surface border border-border hover:border-accent-dark/20 transition-colors rounded-xl p-4 flex items-center gap-4">
          <div className="bg-accent/15 rounded-lg p-2.5">
            <svg className="w-5 h-5 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{pendingCount}</p>
            <p className="text-xs text-text-muted">Pending Verification</p>
          </div>
        </div>
        <div className="bg-surface border border-border hover:border-accent-dark/20 transition-colors rounded-xl p-4 flex items-center gap-4">
          <div className="bg-success/10 rounded-lg p-2.5">
            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{verifiedCount}</p>
            <p className="text-xs text-text-muted">Verified</p>
          </div>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="bg-surface border border-border rounded-xl p-1 inline-flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-white rounded-lg shadow-sm'
                : 'text-text-secondary hover:text-text-primary rounded-lg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <div className="h-4 bg-border/50 rounded w-24 animate-pulse" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-border/50 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border/50 rounded w-1/3" />
                  <div className="h-3 bg-border/30 rounded w-1/5" />
                </div>
                <div className="h-5 bg-border/40 rounded-full w-16 hidden sm:block" />
                <div className="h-5 bg-border/30 rounded w-12 hidden md:block" />
                <div className="h-7 bg-border/30 rounded-lg w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <div className="mx-auto w-16 h-16 bg-border/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">No agents found</h3>
          <p className="text-sm text-text-muted">There are no agents matching the current filter.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/30">
                  <th className="text-left px-4 py-3 font-medium text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                      Agent
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                      Business
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Status
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                      </svg>
                      Tier
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5M10.5 21V8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                      Listings
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted hidden lg:table-cell">
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                      Rating
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {agent.logo_url ? (
                          <Image src={agent.logo_url} alt={agent.user?.full_name || 'Agent avatar'} width={36} height={36} className="rounded-full object-cover ring-2 ring-border" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent-dark text-sm font-bold ring-2 ring-border">
                            {(agent.user?.full_name || 'A').charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-medium">{agent.user?.full_name || '-'}</p>
                          <p className="text-xs text-text-muted">{agent.user?.email || agent.user?.phone || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{agent.company_name}</td>
                    <td className="px-4 py-3"><VerificationBadge status={agent.verification_status} /></td>
                    <td className="px-4 py-3 text-text-secondary capitalize hidden md:table-cell">{agent.subscription_tier}</td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden md:table-cell">{agent.active_listings ?? agent.properties_count ?? 0}</td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden lg:table-cell">{agent.total_leads ?? 0}</td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden lg:table-cell">{agent.avg_rating ? agent.avg_rating.toFixed(1) : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {agent.verification_status === 'pending' && (
                          <>
                            <button onClick={() => handleVerify(agent.id)} className="text-xs bg-success text-white px-3 py-1.5 rounded-lg font-medium hover:bg-success/90 transition-colors">
                              Verify
                            </button>
                            <button onClick={() => setRejectModal(agent.id)} className="text-xs text-error hover:bg-error/5 px-3 py-1.5 rounded-lg font-medium transition-colors">
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-text-muted">Page {meta.current_page} of {meta.last_page}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-background/50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent">Previous</button>
                <button onClick={() => setPage(Math.min(meta.last_page, page + 1))} disabled={page === meta.last_page} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-background/50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-border">
            <div className="flex flex-col items-center mb-5">
              <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Reject Agent</h3>
            </div>

            <div className="bg-error/5 border border-error/15 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-error/90">This action will reject the agent&apos;s verification request. They will be notified with the reason provided below.</p>
            </div>

            <label className="block text-sm font-medium text-text-secondary mb-1.5">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a clear reason for this rejection..."
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-text-primary text-sm mb-5 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all resize-none"
            />

            <div className="flex flex-col gap-2">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="w-full px-4 py-2.5 rounded-xl bg-error text-white text-sm font-medium disabled:opacity-50 hover:bg-error/90 transition-colors"
              >
                Reject Agent
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-background/50 transition-colors"
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
