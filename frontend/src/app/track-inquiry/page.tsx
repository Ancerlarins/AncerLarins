'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTrackInquiryMutation, useAcceptAgreementMutation } from '@/store/api/inquiryApi';
import type { InquiryTrackingResult, InquiryStatus } from '@/types/inquiry';

const STATUS_STEPS: { key: InquiryStatus; label: string }[] = [
  { key: 'new', label: 'Received' },
  { key: 'contacted', label: 'Under Review' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'agreement_signed', label: 'Agreement' },
  { key: 'inspection_scheduled', label: 'Viewing' },
  { key: 'negotiating', label: 'Negotiation' },
  { key: 'offer_made', label: 'Offer Made' },
  { key: 'closed_won', label: 'Closed' },
];

function getStepIndex(status: InquiryStatus): number {
  if (status === 'closed_lost') return -1;
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function TrackInquiryPage() {
  const searchParams = useSearchParams();
  const prefillRef = searchParams.get('ref') || '';

  const [ref, setRef] = useState(prefillRef);
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<InquiryTrackingResult | null>(null);
  const [error, setError] = useState('');

  const [trackInquiry, { isLoading }] = useTrackInquiryMutation();
  const [acceptAgreement, { isLoading: acceptingAgreement }] = useAcceptAgreementMutation();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!ref.trim() || !email.trim()) {
      setError('Please enter both your reference number and email.');
      return;
    }

    try {
      const res = await trackInquiry({ ref: ref.trim().toUpperCase(), email: email.trim() }).unwrap();
      setResult(res.data);
    } catch {
      setError('No inquiry found. Please check your reference number and email address.');
    }
  };

  const handleAcceptAgreement = async () => {
    try {
      await acceptAgreement({ ref: ref.trim().toUpperCase(), email: email.trim() }).unwrap();
      // Refresh tracking data
      const res = await trackInquiry({ ref: ref.trim().toUpperCase(), email: email.trim() }).unwrap();
      setResult(res.data);
    } catch {
      setError('Could not accept agreement. Please try again.');
    }
  };

  const activeStep = result ? getStepIndex(result.status) : -1;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-accent">Ancer</span>
              <span className="text-text-primary">Larins</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Track Your Inquiry</h1>
          <p className="text-text-muted text-sm">Enter your reference number and email to check the status of your private viewing request.</p>
        </div>

        {/* Search Form */}
        {!result && (
          <form onSubmit={handleTrack} className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Reference Number</label>
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value.toUpperCase())}
                placeholder="e.g. AL3F8B2C1D"
                maxLength={10}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-text-primary text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-accent-dark/30 focus:border-accent-dark uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="The email you used when submitting"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-dark/30 focus:border-accent-dark"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-accent-dark hover:bg-accent disabled:opacity-70 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Track My Inquiry
            </button>
          </form>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Back button */}
            <button
              onClick={() => { setResult(null); setError(''); }}
              className="text-sm text-text-muted hover:text-text-primary flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Track another inquiry
            </button>

            {/* Status card */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Reference</p>
                  <p className="text-lg font-mono font-bold text-accent tracking-wider">{result.tracking_ref}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted mb-0.5">Current Status</p>
                  <p className="text-lg font-semibold text-text-primary">{result.status_label}</p>
                </div>
              </div>

              {/* Progress bar */}
              {result.status !== 'closed_lost' && (
                <div className="mb-6">
                  <div className="flex items-center gap-0.5">
                    {STATUS_STEPS.map((step, i) => (
                      <div key={step.key} className="flex-1 flex flex-col items-center">
                        <div
                          className={`h-1.5 w-full rounded-full transition-colors ${
                            i <= activeStep ? 'bg-accent' : 'bg-border'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-text-muted">Received</span>
                    <span className="text-[10px] text-text-muted">Closed</span>
                  </div>
                </div>
              )}

              {result.status === 'closed_lost' && (
                <div className="mb-6 bg-error/10 border border-error/20 rounded-lg px-4 py-3">
                  <p className="text-sm text-error">This inquiry has been closed. Feel free to browse other properties on AncerLarins.</p>
                </div>
              )}

              {/* Property info */}
              {result.property && (
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-xs text-text-muted mb-1">Property</p>
                  <Link href={`/properties/${result.property.slug}`} className="text-sm font-medium text-accent hover:underline">
                    {result.property.title}
                  </Link>
                  <p className="text-sm text-text-muted">{result.property.formatted_price}</p>
                </div>
              )}

              {/* Inspection details */}
              {result.inspection_date && (
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-xs font-medium text-text-muted mb-2">Viewing Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-text-muted">Date:</span>{' '}
                      <span className="text-text-primary font-medium">{new Date(result.inspection_date).toLocaleDateString('en-NG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    {result.inspection_time && (
                      <div>
                        <span className="text-text-muted">Time:</span>{' '}
                        <span className="text-text-primary font-medium">{result.inspection_time}</span>
                      </div>
                    )}
                    {result.inspection_location && (
                      <div className="col-span-2">
                        <span className="text-text-muted">Location:</span>{' '}
                        <span className="text-text-primary">{result.inspection_location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Agreement acceptance */}
              {result.status === 'agreement_signed' && !result.agreement_accepted && (
                <div className="border-t border-border pt-4 mt-4">
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-text-primary mb-2">Buyer Service Agreement</p>
                    <p className="text-xs text-text-muted mb-3">
                      By accepting, you agree that AncerLarins will act as your representative in this transaction.
                      A service fee of 2-3% of the transaction value applies upon successful closing.
                    </p>
                    <button
                      onClick={handleAcceptAgreement}
                      disabled={acceptingAgreement}
                      className="px-4 py-2 bg-accent-dark hover:bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-70 transition-colors"
                    >
                      {acceptingAgreement ? 'Processing...' : 'I Accept the Terms'}
                    </button>
                  </div>
                </div>
              )}

              {result.agreement_accepted && (
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-success">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Service agreement accepted
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs font-medium text-text-muted mb-2">Timeline</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-text-muted">Submitted:</span>
                    <span className="text-text-primary">{new Date(result.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  {result.qualified_at && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-text-muted">Qualified:</span>
                      <span className="text-text-primary">{new Date(result.qualified_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                  {result.inspection_at && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-text-muted">Viewing arranged:</span>
                      <span className="text-text-primary">{new Date(result.inspection_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link href="/properties" className="text-sm text-accent hover:underline">
                Browse more properties
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
