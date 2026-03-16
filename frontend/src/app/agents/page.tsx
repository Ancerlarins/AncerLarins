'use client';

import { useState, useEffect, startTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import type { AgentListItem } from '@/types';

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null);

  useEffect(() => {
    startTransition(() => {
      setLoading(true);
      setError('');
    });
    api.get('/agents', { params: { page, per_page: 12 } })
      .then(({ data }) => {
        setAgents(data.data || []);
        setMeta(data.meta || null);
      })
      .catch(() => { setError('Failed to load agents. Please try again.'); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary py-10 md:py-14">
          <div className="container-app text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Find Verified Agents</h1>
            <p className="text-white/60 max-w-lg mx-auto">
              Browse trusted real estate professionals across Lagos. Every verified agent has been vetted by our team.
            </p>
          </div>
        </div>

        <div className="container-app py-8">
          {error ? (
            <div className="text-center py-16">
              <p className="text-error mb-4">{error}</p>
              <button onClick={() => setPage(page)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-xl border border-border animate-pulse p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-border/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-border/50 rounded w-2/3" />
                      <div className="h-3 bg-border/50 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-4 bg-border/50 rounded w-full mb-2" />
                  <div className="h-4 bg-border/50 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No agents available yet</h3>
              <p className="text-text-muted mb-4">Be among the first agents on AncerLarins.</p>
              <Link href="/register?role=agent" className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-light transition-colors inline-block">
                Register as Agent
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-text-muted">
                  {meta ? `${meta.total} agent${meta.total !== 1 ? 's' : ''}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="group bg-surface rounded-xl border border-border p-6 hover:border-accent-dark/30 hover:shadow-lg transition-all"
                  >
                    {/* Agent Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        {agent.logo_url ? (
                          <Image src={agent.logo_url} alt={agent.company_name || 'Agent'} width={56} height={56} className="w-14 h-14 rounded-full object-cover" unoptimized />
                        ) : (
                          <span className="text-accent-dark font-bold text-xl">
                            {agent.company_name?.[0] || 'A'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-text-primary truncate group-hover:text-primary-light transition-colors">
                          {agent.company_name}
                        </h3>
                        {agent.user && (
                          <p className="text-sm text-text-muted truncate">{agent.user.full_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {agent.verification_status === 'verified' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                      {agent.years_experience && (
                        <span className="text-xs text-text-muted bg-background px-2 py-0.5 rounded-full">
                          {agent.years_experience}+ years
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-text-secondary pt-3 border-t border-border">
                      {agent.avg_rating !== null && agent.avg_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-accent-dark" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {agent.avg_rating.toFixed(1)}
                          {agent.total_reviews > 0 && (
                            <span className="text-text-muted">({agent.total_reviews})</span>
                          )}
                        </span>
                      )}
                      {agent.properties_count !== undefined && (
                        <span className="text-text-muted">
                          {agent.properties_count} listing{agent.properties_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Specializations */}
                    {agent.specializations && agent.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {agent.specializations.slice(0, 3).map((spec) => (
                          <span key={spec} className="text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded capitalize">
                            {spec.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {agent.specializations.length > 3 && (
                          <span className="text-xs text-text-muted px-1">
                            +{agent.specializations.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-sm disabled:opacity-30 hover:bg-surface transition-colors"
                    aria-label="Previous page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-sm text-text-muted px-3">
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-sm disabled:opacity-30 hover:bg-surface transition-colors"
                    aria-label="Next page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA for agents */}
        <div className="bg-surface border-t border-border">
          <div className="container-app py-12 text-center">
            <h2 className="text-xl font-bold text-text-primary mb-2">Are you a real estate agent?</h2>
            <p className="text-text-muted mb-6 max-w-md mx-auto">
              Join AncerLarins and connect with thousands of property seekers across Lagos.
            </p>
            <Link href="/register?role=agent" className="bg-primary hover:bg-primary-light text-white px-8 py-3.5 rounded-xl font-semibold transition-colors inline-block">
              Register as Agent
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
