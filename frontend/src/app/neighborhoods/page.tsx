'use client';

import { useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface Area {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avg_rent_kobo: number | null;
  avg_sale_price_kobo: number | null;
  safety_rating: number | null;
  properties_count: number;
  city?: { id: string; name: string };
}

export default function NeighborhoodsPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    startTransition(() => { setError(''); });
    api.get('/locations/areas')
      .then(({ data }) => setAreas(data.data || []))
      .catch(() => { setError('Failed to load neighborhoods. Please try again.'); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="bg-primary py-8">
          <div className="container-app">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Lagos Neighborhoods</h1>
            <p className="text-white/60 mt-1">Explore popular areas across Lagos and find the perfect location</p>
          </div>
        </div>

        <div className="container-app py-8">
          {error ? (
            <div className="text-center py-16">
              <p className="text-error mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-xl border border-border animate-pulse">
                  <div className="h-48 bg-border/50 rounded-t-xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-border/50 rounded w-1/2" />
                    <div className="h-4 bg-border/50 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : areas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areas.map((area) => (
                <Link
                  key={area.id}
                  href={`/neighborhoods/${area.slug}`}
                  className="group block bg-surface rounded-xl overflow-hidden border border-border hover:border-accent-dark/30 transition-colors"
                >
                  <div className="relative h-48 bg-primary">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 to-primary/40" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                      <h2 className="font-bold text-xl group-hover:text-accent transition-colors">{area.name}</h2>
                      {area.city && (
                        <p className="text-white/70 text-sm mt-1">{area.city.name}</p>
                      )}
                    </div>
                    {area.safety_rating && (
                      <span className="absolute top-3 right-3 bg-white/90 text-text-primary text-xs px-2 py-1 rounded-full font-medium">
                        Safety: {area.safety_rating}/10
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    {area.description && (
                      <p className="text-sm text-text-muted line-clamp-2 mb-3">{area.description}</p>
                    )}

                    <div className="flex gap-4 text-sm">
                      {area.avg_rent_kobo && (
                        <div>
                          <span className="text-text-muted">Avg Rent:</span>{' '}
                          <span className="font-medium text-accent-dark">{formatPrice(area.avg_rent_kobo)}/yr</span>
                        </div>
                      )}
                      {area.avg_sale_price_kobo && (
                        <div>
                          <span className="text-text-muted">Avg Sale:</span>{' '}
                          <span className="font-medium text-accent-dark">{formatPrice(area.avg_sale_price_kobo)}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-text-muted mt-2">
                      {area.properties_count} {area.properties_count === 1 ? 'property' : 'properties'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No neighborhoods available yet</h3>
              <p className="text-text-muted">Check back soon as we add more areas.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
