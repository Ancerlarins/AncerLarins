'use client';

import Link from 'next/link';

// Subscription functionality is built and ready but hidden until the platform
// has enough buyer pipeline leverage to introduce agent premium tiers.
// All backend routes, models, and Paystack integration remain intact.

export default function SubscriptionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Listing Plan</h1>
        <p className="text-text-secondary mt-1">Your current listing status</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-success" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Free — No Limits</h2>
        <p className="text-text-muted text-sm max-w-md mx-auto mb-6">
          Listing on AncerLarins is completely free for all verified agents. No subscriptions, no listing fees, no hidden charges.
          Focus on what matters — listing great properties and closing deals.
        </p>
        <Link
          href="/dashboard/listings/new"
          className="inline-flex items-center gap-2 bg-accent-dark hover:bg-accent text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          List a New Property
        </Link>
      </div>
    </div>
  );
}
