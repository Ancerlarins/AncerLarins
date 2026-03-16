'use client';

import { useState, useEffect, use, startTransition } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { PropertyListItem } from '@/types';

interface AreaDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avg_rent_kobo: number | null;
  avg_sale_price_kobo: number | null;
  safety_rating: number | null;
  infrastructure_rating: number | null;
  transport_rating: number | null;
  nightlife_rating: number | null;
  properties_count: number;
  landmarks: string[] | null;
  city?: { id: string; name: string };
  state?: { id: string; name: string };
}

export default function NeighborhoodDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [area, setArea] = useState<AreaDetail | null>(null);
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    startTransition(() => {
      setLoading(true);
      setError('');
    });
    Promise.all([
      api.get(`/locations/areas/${slug}`),
      api.get('/properties', { params: { area_slug: slug, per_page: 12 } }),
    ])
      .then(([areaRes, propRes]) => {
        setArea(areaRes.data.data);
        setProperties(propRes.data.data || []);
      })
      .catch(() => { setError('Failed to load neighborhood details. Please try again.'); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-error mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="bg-primary py-12">
            <div className="container-app">
              <div className="h-8 bg-white/10 rounded w-1/3 animate-pulse" />
              <div className="h-5 bg-white/10 rounded w-1/4 mt-3 animate-pulse" />
            </div>
          </div>
          <div className="container-app py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!area) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Neighborhood not found</h2>
            <p className="text-text-muted mb-4">The area you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/neighborhoods" className="text-accent-dark font-medium hover:underline">
              Browse all neighborhoods
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary py-12">
          <div className="container-app">
            <nav className="text-white/40 text-sm mb-4">
              <Link href="/neighborhoods" className="hover:text-white/60">Neighborhoods</Link>
              <span className="mx-2">/</span>
              <span className="text-white/70">{area.name}</span>
            </nav>
            <h1 className="text-3xl font-bold text-white">{area.name}</h1>
            {area.city && (
              <p className="text-white/60 mt-1">{area.city.name}{area.state ? `, ${area.state.name}` : ''}</p>
            )}
          </div>
        </div>

        <div className="container-app py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {area.description && (
                <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-2">About {area.name}</h2>
                  <p className="text-text-secondary leading-relaxed">{area.description}</p>
                </div>
              )}

              {/* Landmarks */}
              {area.landmarks && area.landmarks.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-3">Key Landmarks</h2>
                  <div className="flex flex-wrap gap-2">
                    {area.landmarks.map((landmark, i) => (
                      <span key={i} className="bg-accent/10 text-accent-dark px-3 py-1.5 rounded-lg text-sm">
                        {landmark}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Properties */}
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Properties in {area.name}
                  <span className="text-sm font-normal text-text-muted ml-2">
                    ({properties.length} {properties.length === 1 ? 'listing' : 'listings'})
                  </span>
                </h2>
                {properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted text-sm py-8 text-center">No properties listed in this area yet.</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold text-text-primary mb-4">Area Stats</h3>
                <dl className="space-y-3 text-sm">
                  {area.avg_rent_kobo && (
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Avg. Rent</dt>
                      <dd className="font-medium text-accent-dark">{formatPrice(area.avg_rent_kobo)}/yr</dd>
                    </div>
                  )}
                  {area.avg_sale_price_kobo && (
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Avg. Sale Price</dt>
                      <dd className="font-medium text-accent-dark">{formatPrice(area.avg_sale_price_kobo)}</dd>
                    </div>
                  )}
                  {area.safety_rating && (
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Safety</dt>
                      <dd className="font-medium text-text-primary">{area.safety_rating}/10</dd>
                    </div>
                  )}
                  {area.infrastructure_rating && (
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Infrastructure</dt>
                      <dd className="font-medium text-text-primary">{area.infrastructure_rating}/10</dd>
                    </div>
                  )}
                  {area.transport_rating && (
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Transport</dt>
                      <dd className="font-medium text-text-primary">{area.transport_rating}/10</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Properties</dt>
                    <dd className="font-medium text-text-primary">{area.properties_count}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-accent/10 border border-accent/20 rounded-xl p-6">
                <h3 className="font-semibold text-text-primary mb-2">Looking for a place here?</h3>
                <p className="text-sm text-text-muted mb-4">
                  Browse all properties in {area.name} or contact an agent.
                </p>
                <Link
                  href={`/properties?area=${area.slug}`}
                  className="block w-full bg-accent hover:bg-accent-dark text-primary text-center py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Search Properties
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
