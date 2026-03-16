'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCreatePropertyMutation } from '@/store/api/propertyApi';
import type { CreatePropertyPayload, ListingType, Furnishing, RentPeriod } from '@/types';

const FURNISHING_OPTIONS: { value: Furnishing; label: string }[] = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'furnished', label: 'Furnished' },
];

const RENT_PERIOD_OPTIONS: { value: RentPeriod; label: string }[] = [
  { value: 'yearly', label: 'Per Year' },
  { value: 'monthly', label: 'Per Month' },
  { value: 'quarterly', label: 'Per Quarter' },
];

const SHORT_LET_RENT_PERIOD_OPTIONS: { value: RentPeriod; label: string }[] = [
  { value: 'daily', label: 'Per Night' },
  { value: 'weekly', label: 'Per Week' },
];

export default function NewPropertyPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [createProperty, { isLoading }] = useCreatePropertyMutation();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    listing_type: 'rent' as ListingType,
    property_type_id: '',
    title: '',
    description: '',
    price_kobo: '',
    price_negotiable: false,
    rent_period: 'yearly' as RentPeriod,
    agency_fee_pct: '',
    caution_fee_kobo: '',
    service_charge_kobo: '',
    state_id: '',
    city_id: '',
    area_id: '',
    address: '',
    landmark_note: '',
    bedrooms: '',
    bathrooms: '',
    toilets: '',
    sitting_rooms: '',
    floor_area_sqm: '',
    land_area_sqm: '',
    year_built: '',
    furnishing: 'unfurnished' as Furnishing,
    parking_spaces: '',
    has_bq: false,
    has_swimming_pool: false,
    has_gym: false,
    has_cctv: false,
    has_generator: false,
    has_water_supply: false,
    has_prepaid_meter: false,
    is_serviced: false,
    is_new_build: false,
    inspection_available: true,
    min_stay_days: '',
    max_stay_days: '',
    check_in_time: '14:00',
    check_out_time: '11:00',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload: CreatePropertyPayload = {
      listing_type: form.listing_type,
      property_type_id: form.property_type_id,
      title: form.title,
      description: form.description,
      price_kobo: Number(form.price_kobo) * 100,
      price_negotiable: form.price_negotiable,
      state_id: form.state_id,
      city_id: form.city_id,
      address: form.address,
      furnishing: form.furnishing,
      inspection_available: form.inspection_available,
      has_bq: form.has_bq,
      has_swimming_pool: form.has_swimming_pool,
      has_gym: form.has_gym,
      has_cctv: form.has_cctv,
      has_generator: form.has_generator,
      has_water_supply: form.has_water_supply,
      has_prepaid_meter: form.has_prepaid_meter,
      is_serviced: form.is_serviced,
      is_new_build: form.is_new_build,
    };

    if (form.listing_type === 'rent' || form.listing_type === 'short_let') payload.rent_period = form.rent_period;
    if (form.listing_type === 'short_let') {
      if (form.min_stay_days) payload.min_stay_days = Number(form.min_stay_days);
      if (form.max_stay_days) payload.max_stay_days = Number(form.max_stay_days);
      if (form.check_in_time) payload.check_in_time = form.check_in_time;
      if (form.check_out_time) payload.check_out_time = form.check_out_time;
    }
    if (form.area_id) payload.area_id = form.area_id;
    if (form.landmark_note) payload.landmark_note = form.landmark_note;
    if (form.bedrooms) payload.bedrooms = Number(form.bedrooms);
    if (form.bathrooms) payload.bathrooms = Number(form.bathrooms);
    if (form.toilets) payload.toilets = Number(form.toilets);
    if (form.sitting_rooms) payload.sitting_rooms = Number(form.sitting_rooms);
    if (form.floor_area_sqm) payload.floor_area_sqm = Number(form.floor_area_sqm);
    if (form.land_area_sqm) payload.land_area_sqm = Number(form.land_area_sqm);
    if (form.year_built) payload.year_built = Number(form.year_built);
    if (form.parking_spaces) payload.parking_spaces = Number(form.parking_spaces);
    if (form.agency_fee_pct) payload.agency_fee_pct = Number(form.agency_fee_pct);
    if (form.caution_fee_kobo) payload.caution_fee_kobo = Number(form.caution_fee_kobo) * 100;
    if (form.service_charge_kobo) payload.service_charge_kobo = Number(form.service_charge_kobo) * 100;

    try {
      const result = await createProperty(payload).unwrap();
      if (result.data?.slug) {
        router.push(`/properties/${result.data.slug}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      if (apiErr?.data?.errors) {
        const firstErr = Object.values(apiErr.data.errors)[0]?.[0];
        setError(firstErr || apiErr?.data?.message || 'Failed to create property.');
      } else {
        setError(apiErr?.data?.message || 'Failed to create property.');
      }
    }
  };

  if (!isAuthenticated || !user) return null;

  const inputClass = 'w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:border-accent-dark text-text-primary text-sm';
  const labelClass = 'block text-sm font-medium text-text-secondary mb-1.5';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="bg-primary py-8">
          <div className="container-app">
            <h1 className="text-2xl font-bold text-white">List a New Property</h1>
            <p className="text-white/60 mt-1">Fill in the details below to publish your listing</p>
          </div>
        </div>

        <div className="container-app py-8">
          <div className="max-w-3xl">
            {error && (
              <div className="bg-error/10 text-error p-3 rounded-xl mb-6 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-text-primary">Basic Information</h2>

                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g. Spacious 3 Bedroom Apartment in Lekki Phase 1"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe the property in detail..."
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Listing Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['rent', 'sale', 'short_let'] as ListingType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            updateField('listing_type', type);
                            if (type === 'short_let') updateField('rent_period', 'daily');
                            else if (type === 'rent') updateField('rent_period', 'yearly');
                          }}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                            form.listing_type === type
                              ? 'bg-primary text-white border-primary'
                              : 'bg-background text-text-secondary border-border hover:border-accent-dark'
                          }`}
                        >
                          {type === 'rent' ? 'For Rent' : type === 'sale' ? 'For Sale' : 'Short Let'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Furnishing</label>
                    <select
                      value={form.furnishing}
                      onChange={(e) => updateField('furnishing', e.target.value)}
                      className={inputClass}
                    >
                      {FURNISHING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Price (NGN)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.price_kobo}
                      onChange={(e) => updateField('price_kobo', e.target.value)}
                      placeholder="e.g. 3500000"
                      className={inputClass}
                    />
                  </div>
                  {(form.listing_type === 'rent' || form.listing_type === 'short_let') && (
                    <div>
                      <label className={labelClass}>Rent Period</label>
                      <select
                        value={form.rent_period}
                        onChange={(e) => updateField('rent_period', e.target.value)}
                        className={inputClass}
                      >
                        {(form.listing_type === 'short_let' ? SHORT_LET_RENT_PERIOD_OPTIONS : RENT_PERIOD_OPTIONS).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.price_negotiable}
                    onChange={(e) => updateField('price_negotiable', e.target.checked)}
                    className="w-4 h-4 text-accent-dark border-border rounded focus:ring-accent-dark"
                  />
                  <span className="text-sm text-text-secondary">Price is negotiable</span>
                </label>
              </section>

              {/* Property Details */}
              <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-text-primary">Property Details</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className={labelClass}>Bedrooms</label>
                    <input type="number" min="0" value={form.bedrooms} onChange={(e) => updateField('bedrooms', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Bathrooms</label>
                    <input type="number" min="0" value={form.bathrooms} onChange={(e) => updateField('bathrooms', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Toilets</label>
                    <input type="number" min="0" value={form.toilets} onChange={(e) => updateField('toilets', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Sitting Rooms</label>
                    <input type="number" min="0" value={form.sitting_rooms} onChange={(e) => updateField('sitting_rooms', e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Floor Area (sqm)</label>
                    <input type="number" min="0" value={form.floor_area_sqm} onChange={(e) => updateField('floor_area_sqm', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Land Area (sqm)</label>
                    <input type="number" min="0" value={form.land_area_sqm} onChange={(e) => updateField('land_area_sqm', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Parking Spaces</label>
                    <input type="number" min="0" value={form.parking_spaces} onChange={(e) => updateField('parking_spaces', e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Year Built</label>
                    <input type="number" min="1900" max="2026" value={form.year_built} onChange={(e) => updateField('year_built', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </section>

              {/* Location */}
              <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-text-primary">Location</h2>

                <div>
                  <label className={labelClass}>Address</label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Landmark Note</label>
                  <input
                    type="text"
                    value={form.landmark_note}
                    onChange={(e) => updateField('landmark_note', e.target.value)}
                    placeholder="e.g. Near Lekki Conservation Centre"
                    className={inputClass}
                  />
                </div>
              </section>

              {/* Short Let Details */}
              {form.listing_type === 'short_let' && (
                <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
                  <h2 className="font-semibold text-text-primary">Short Let Details</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={labelClass}>Min Stay (days)</label>
                      <input type="number" min="1" max="365" value={form.min_stay_days} onChange={(e) => updateField('min_stay_days', e.target.value)} placeholder="1" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Max Stay (days)</label>
                      <input type="number" min="1" max="365" value={form.max_stay_days} onChange={(e) => updateField('max_stay_days', e.target.value)} placeholder="30" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Check-in Time</label>
                      <input type="time" value={form.check_in_time} onChange={(e) => updateField('check_in_time', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Check-out Time</label>
                      <input type="time" value={form.check_out_time} onChange={(e) => updateField('check_out_time', e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>
              )}

              {/* Additional Costs */}
              {(form.listing_type === 'rent' || form.listing_type === 'short_let') && (
                <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
                  <h2 className="font-semibold text-text-primary">Additional Costs (NGN)</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Agency Fee (%)</label>
                      <input type="number" min="0" max="100" value={form.agency_fee_pct} onChange={(e) => updateField('agency_fee_pct', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Caution Fee</label>
                      <input type="number" min="0" value={form.caution_fee_kobo} onChange={(e) => updateField('caution_fee_kobo', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Service Charge</label>
                      <input type="number" min="0" value={form.service_charge_kobo} onChange={(e) => updateField('service_charge_kobo', e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>
              )}

              {/* Amenities */}
              <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-text-primary">Amenities & Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'has_bq', label: 'BQ (Boys Quarter)' },
                    { key: 'has_swimming_pool', label: 'Swimming Pool' },
                    { key: 'has_gym', label: 'Gym' },
                    { key: 'has_cctv', label: 'CCTV Security' },
                    { key: 'has_generator', label: 'Generator' },
                    { key: 'has_water_supply', label: '24/7 Water Supply' },
                    { key: 'has_prepaid_meter', label: 'Prepaid Meter' },
                    { key: 'is_serviced', label: 'Serviced' },
                    { key: 'is_new_build', label: 'New Build' },
                    { key: 'inspection_available', label: 'Inspection Available' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[key as keyof typeof form] as boolean}
                        onChange={(e) => updateField(key, e.target.checked)}
                        className="w-4 h-4 text-accent-dark border-border rounded focus:ring-accent-dark"
                      />
                      <span className="text-sm text-text-secondary">{label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent-dark text-primary py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-50 text-base"
              >
                {isLoading ? 'Publishing...' : 'Publish Property'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
