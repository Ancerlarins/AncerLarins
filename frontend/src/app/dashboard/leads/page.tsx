'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useGetAgentLeadsQuery, useRespondToLeadMutation } from '@/store/api/agentApi';
import { formatRelativeTime } from '@/lib/utils';

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAgentLeadsQuery({ page, per_page: 20 });
  const [respondToLead] = useRespondToLeadMutation();

  const leads = data?.data || [];
  const meta = data?.meta;

  const handleRespond = async (leadId: string) => {
    try {
      await respondToLead(leadId).unwrap();
    } catch { /* handled by RTK */ }
  };

  const totalLeads = meta?.total || 0;
  const unrespondedLeads = leads.filter((l) => !l.responded_at).length;
  const respondedLeads = leads.filter((l) => l.responded_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-11 h-11 bg-primary/10 rounded-lg">
          <svg className="w-5 h-5 text-accent-dark" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Leads</h1>
          {meta && (
            <p className="text-sm text-text-muted mt-0.5">{meta.total} total lead{meta.total !== 1 ? 's' : ''} across all pages</p>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Leads */}
          <div className="bg-surface border border-border rounded-2xl p-5 hover:border-accent-dark/20 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-9 h-9 bg-accent-dark/10 rounded-lg">
                <svg className="w-4.5 h-4.5 text-accent-dark" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Leads</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{totalLeads}</p>
          </div>

          {/* Unresponded */}
          <div className="bg-surface border border-border rounded-2xl p-5 hover:border-accent-dark/20 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-9 h-9 bg-yellow-500/10 rounded-lg">
                <svg className="w-4.5 h-4.5 text-yellow-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Unresponded</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{unrespondedLeads}</p>
          </div>

          {/* Responded */}
          <div className="bg-surface border border-border rounded-2xl p-5 hover:border-accent-dark/20 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-9 h-9 bg-success/10 rounded-lg">
                <svg className="w-4.5 h-4.5 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Responded</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{respondedLeads}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        /* Enhanced Skeleton matching table row layout */
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Skeleton header */}
          <div className="border-b border-border px-4 py-3 flex gap-4">
            <div className="h-3 bg-border/40 rounded w-24 animate-pulse" />
            <div className="h-3 bg-border/40 rounded w-20 animate-pulse" />
            <div className="h-3 bg-border/40 rounded w-16 animate-pulse hidden sm:block" />
            <div className="h-3 bg-border/40 rounded w-16 animate-pulse hidden md:block" />
            <div className="h-3 bg-border/40 rounded w-14 animate-pulse" />
            <div className="h-3 bg-border/40 rounded w-20 animate-pulse ml-auto" />
          </div>
          {/* Skeleton rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-b-0 animate-pulse">
              <div className="w-12 h-9 bg-border/30 rounded shrink-0" />
              <div className="h-3.5 bg-border/40 rounded w-28" />
              <div className="flex flex-col gap-1.5 ml-4">
                <div className="h-3.5 bg-border/40 rounded w-24" />
                <div className="h-2.5 bg-border/30 rounded w-20" />
              </div>
              <div className="h-3 bg-border/30 rounded w-16 hidden sm:block ml-auto" />
              <div className="h-3 bg-border/30 rounded w-14 hidden md:block" />
              <div className="h-3 bg-border/30 rounded w-16 ml-auto" />
              <div className="h-7 bg-border/30 rounded-lg w-16" />
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        /* Enhanced Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-surface border border-border rounded-2xl">
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-5">
            <svg className="w-7 h-7 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1.5">No leads yet</h3>
          <p className="text-sm text-text-muted max-w-sm text-center">
            Publish and promote your listings to start receiving inquiries from potential buyers and renters.
          </p>
        </div>
      ) : (
        /* Enhanced Table */
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/30">
                  <th className="text-left px-4 py-3 font-medium text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                      </svg>
                      Property
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                      Contact
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                      Type
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      Date
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted">
                    <span className="inline-flex items-center gap-1.5 ml-auto">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Status
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {lead.property?.cover_image?.thumbnail_url && (
                          <div className="w-12 h-9 rounded-lg bg-border/50 overflow-hidden shrink-0 ring-1 ring-border">
                            <Image src={lead.property.cover_image.thumbnail_url} alt={lead.property.title || 'Property'} width={48} height={36} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-text-primary font-medium truncate max-w-48">
                          {lead.property?.title || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-text-primary text-sm font-medium">{lead.user?.full_name || 'Anonymous'}</p>
                      {lead.user?.phone && (
                        <p className="text-xs text-text-muted mt-0.5">{lead.user.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        lead.contact_type === 'whatsapp' ? 'text-whatsapp bg-whatsapp/10' :
                        lead.contact_type === 'call' ? 'text-accent-dark bg-accent-dark/10' : 'text-text-secondary bg-border/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          lead.contact_type === 'whatsapp' ? 'bg-whatsapp' :
                          lead.contact_type === 'call' ? 'bg-accent-dark' : 'bg-text-muted'
                        }`} />
                        {lead.contact_type === 'whatsapp' ? 'WhatsApp' :
                         lead.contact_type === 'call' ? 'Phone Call' : 'Form'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-text-muted text-xs whitespace-nowrap hidden md:table-cell">
                      {formatRelativeTime(lead.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {lead.responded_at ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-success font-medium bg-success/10 px-2.5 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          Responded {formatRelativeTime(lead.responded_at)}
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {lead.user?.phone && (
                            <a
                              href={`https://wa.me/${lead.user.phone.replace(/[^0-9+]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs bg-whatsapp text-white px-3 py-1.5 rounded-lg font-medium hover:bg-whatsapp/90 transition-colors shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                              </svg>
                              WhatsApp
                            </a>
                          )}
                          <button
                            onClick={() => handleRespond(lead.id)}
                            className="text-xs text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded-lg border border-border hover:border-accent-dark/30 transition-colors"
                          >
                            Mark Done
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-text-muted">
                Page {meta.current_page} of {meta.last_page}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:border-accent-dark/30 transition-colors disabled:opacity-40 disabled:hover:border-border"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(meta.last_page, page + 1))}
                  disabled={page === meta.last_page}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:border-accent-dark/30 transition-colors disabled:opacity-40 disabled:hover:border-border"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
