'use client';

import { useState, useEffect, startTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import api from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { AgentDetail, AgentReview } from '@/types';

export default function AgentDetailContent({ id }: { id: string }) {
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    startTransition(() => { setLoading(true); });
    Promise.all([
      api.get(`/agents/${id}`),
      api.get(`/agents/${id}/reviews`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([agentRes, reviewsRes]) => {
        setAgent(agentRes.data.data);
        setReviews(reviewsRes.data.data || []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="bg-primary py-12">
            <div className="container-app">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 bg-white/10 rounded w-48 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-32 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <div className="container-app py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-xl border border-border animate-pulse h-48" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !agent) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Agent not found</h2>
            <p className="text-text-muted mb-4">This agent profile doesn&apos;t exist or has been removed.</p>
            <Link href="/agents" className="text-primary font-medium hover:underline">
              Browse all agents
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const properties = agent.recent_properties || [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary py-10 md:py-14">
          <div className="container-app">
            <nav className="flex items-center gap-1.5 text-sm text-white/40 mb-6">
              <Link href="/agents" className="hover:text-white/60">Agents</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-white/70">{agent.company_name}</span>
            </nav>

            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                {agent.logo_url ? (
                  <Image src={agent.logo_url} alt={agent.company_name || 'Agent'} width={80} height={80} className="w-20 h-20 rounded-2xl object-cover" unoptimized />
                ) : (
                  <span className="text-accent text-3xl font-bold">{agent.company_name?.[0] || 'A'}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{agent.company_name}</h1>
                  {agent.verification_status === 'verified' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
                {agent.user && (
                  <p className="text-white/60 mt-1">{agent.user.full_name}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {agent.avg_rating !== null && agent.avg_rating > 0 && (
                    <span className="flex items-center gap-1 text-sm text-accent">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {agent.avg_rating.toFixed(1)} ({agent.total_reviews} review{agent.total_reviews !== 1 ? 's' : ''})
                    </span>
                  )}
                  {agent.years_experience && (
                    <span className="text-sm text-white/40">{agent.years_experience}+ years experience</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-app py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio */}
              {agent.bio && (
                <div className="bg-surface rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-3">About</h2>
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">{agent.bio}</p>
                </div>
              )}

              {/* Specializations */}
              {agent.specializations && agent.specializations.length > 0 && (
                <div className="bg-surface rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-3">Specializations</h2>
                  <div className="flex flex-wrap gap-2">
                    {agent.specializations.map((spec) => (
                      <span key={spec} className="bg-accent/10 text-accent-dark px-3 py-1.5 rounded-lg text-sm font-medium capitalize">
                        {spec.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Listings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Listings
                    {agent.total_listings !== undefined && (
                      <span className="text-sm font-normal text-text-muted ml-2">({agent.total_listings})</span>
                    )}
                  </h2>
                </div>
                {properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} source="agent" />
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface rounded-xl border border-border p-8 text-center">
                    <p className="text-text-muted">No active listings at the moment.</p>
                  </div>
                )}
              </div>

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Reviews</h2>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-surface rounded-xl border border-border p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent-dark text-sm font-bold">
                              {review.user?.full_name?.[0] || '?'}
                            </div>
                            <span className="text-sm font-medium text-text-primary">{review.user?.full_name || 'Anonymous'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-accent-dark" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-bold text-accent-dark">{review.overall_rating}</span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
                        )}
                        <p className="text-xs text-text-muted mt-2">{formatRelativeTime(review.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Agent Info Card */}
              <div className="bg-surface rounded-xl border border-border p-6 sticky top-20">
                <h3 className="font-semibold text-text-primary mb-4">Agent Info</h3>

                {/* View Listings CTA */}
                {properties.length > 0 && (
                  <div className="bg-accent-dark/5 border border-accent-dark/10 rounded-xl p-4 mb-4 text-center">
                    <p className="text-sm text-text-secondary mb-2">Interested in this agent&apos;s properties?</p>
                    <p className="text-xs text-text-muted">Request a private viewing on any listing page</p>
                  </div>
                )}

                {agent.avg_response_time !== null && agent.avg_response_time !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted bg-background rounded-lg px-3 py-2 mb-4">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {agent.avg_response_time < 60
                      ? `Usually responds within ${agent.avg_response_time} min`
                      : `Usually responds within ${Math.round(agent.avg_response_time / 60)} hours`}
                  </div>
                )}

                <dl className="space-y-3 text-sm">
                  {agent.office_address && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-text-secondary">{agent.office_address}</span>
                    </div>
                  )}
                  {agent.website && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={agent.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                        {agent.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {agent.license_number && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-text-secondary">License: {agent.license_number}</span>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
