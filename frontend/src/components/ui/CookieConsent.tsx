'use client';

import { useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cookie-consent';

interface ConsentData {
  accepted: boolean;
  level: 'all' | 'essential';
  timestamp: string;
}

function getConsent(): ConsentData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(level: 'all' | 'essential') {
  const data: ConsentData = { accepted: true, level, timestamp: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => !getConsent());

  function handleAccept(level: 'all' | 'essential') {
    saveConsent(level);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface/95 backdrop-blur-md p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm text-text-primary font-semibold mb-1">We value your privacy</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              We use essential cookies for authentication and site functionality.
              No advertising or tracking cookies are used. See our{' '}
              <Link href="/privacy" className="text-accent-dark underline underline-offset-2 hover:text-primary">
                Privacy Policy
              </Link>{' '}
              for details on how we handle your data under NDPR guidelines.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => handleAccept('essential')}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-transparent text-text-secondary hover:border-accent-dark hover:text-text-primary transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={() => handleAccept('all')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary-light text-white transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
