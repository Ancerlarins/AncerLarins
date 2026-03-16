'use client';

import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema, type ListingFormData } from '@/lib/schemas/listing';
import { useGetMyPropertyByIdQuery } from '@/store/api/agentApi';
import { useUpdatePropertyMutation } from '@/store/api/propertyApi';
import { useGetStatesQuery, useGetCitiesQuery, useGetAreasQuery, useGetPropertyTypesQuery } from '@/store/api/locationApi';
import type { CreatePropertyPayload, ListingType, Furnishing } from '@/types';

const FURNISHING_OPTIONS: { value: Furnishing; label: string }[] = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'furnished', label: 'Furnished' },
];

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading: loading } = useGetMyPropertyByIdQuery(id);
  const [updateProperty, { isLoading: saving }] = useUpdatePropertyMutation();
  const { data: statesData } = useGetStatesQuery();
  const { data: propertyTypesData } = useGetPropertyTypesQuery();

  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      listing_type: 'rent',
      property_type_id: '',
      title: '',
      description: '',
      price_naira: '',
      price_negotiable: false,
      rent_period: 'yearly',
      agency_fee_pct: '',
      caution_fee_naira: '',
      service_charge_naira: '',
      legal_fee_naira: '',
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
      furnishing: 'unfurnished',
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
    },
  });

  const form = watch();
  const property = data?.data;

  const { data: citiesData } = useGetCitiesQuery(form.state_id, { skip: !form.state_id });
  const { data: areasData } = useGetAreasQuery(form.city_id, { skip: !form.city_id });

  const states = statesData?.data || [];
  const cities = citiesData?.data || [];
  const areas = areasData?.data || [];
  const propertyTypes = propertyTypesData?.data || [];

  useEffect(() => {
    if (property) {
      reset({
        listing_type: property.listing_type,
        property_type_id: property.property_type?.id || '',
        title: property.title,
        description: property.description || '',
        price_naira: String(property.price_kobo / 100),
        price_negotiable: property.price_negotiable,
        rent_period: property.rent_period || 'yearly',
        agency_fee_pct: property.agency_fee_pct?.toString() || '',
        caution_fee_naira: property.caution_fee_kobo ? String(property.caution_fee_kobo / 100) : '',
        service_charge_naira: property.service_charge_kobo ? String(property.service_charge_kobo / 100) : '',
        legal_fee_naira: property.legal_fee_kobo ? String(property.legal_fee_kobo / 100) : '',
        state_id: property.state?.id || '',
        city_id: property.city?.id || '',
        area_id: property.area?.id || '',
        address: property.address,
        landmark_note: property.landmark_note || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        toilets: property.toilets?.toString() || '',
        sitting_rooms: property.sitting_rooms?.toString() || '',
        floor_area_sqm: property.floor_area_sqm?.toString() || '',
        land_area_sqm: property.land_area_sqm?.toString() || '',
        year_built: property.year_built?.toString() || '',
        furnishing: property.furnishing || 'unfurnished',
        parking_spaces: property.parking_spaces?.toString() || '',
        has_bq: property.has_bq,
        has_swimming_pool: property.has_swimming_pool,
        has_gym: property.has_gym,
        has_cctv: property.has_cctv,
        has_generator: property.has_generator,
        has_water_supply: property.has_water_supply,
        has_prepaid_meter: property.has_prepaid_meter,
        is_serviced: property.is_serviced,
        is_new_build: property.is_new_build,
        inspection_available: property.inspection_available,
        min_stay_days: '',
        max_stay_days: '',
        check_in_time: '14:00',
        check_out_time: '11:00',
      });
    }
  }, [property, reset]);

  const onSubmit = async (data: ListingFormData) => {
    setApiError('');
    setSuccess('');

    const payload: Partial<CreatePropertyPayload> = {
      listing_type: data.listing_type,
      property_type_id: data.property_type_id,
      title: data.title,
      description: data.description,
      price_kobo: Math.round(Number(data.price_naira) * 100),
      price_negotiable: data.price_negotiable,
      state_id: data.state_id,
      city_id: data.city_id,
      address: data.address,
      furnishing: data.furnishing,
      has_bq: data.has_bq,
      has_swimming_pool: data.has_swimming_pool,
      has_gym: data.has_gym,
      has_cctv: data.has_cctv,
      has_generator: data.has_generator,
      has_water_supply: data.has_water_supply,
      has_prepaid_meter: data.has_prepaid_meter,
      is_serviced: data.is_serviced,
      is_new_build: data.is_new_build,
      inspection_available: data.inspection_available,
    };
    if (data.listing_type === 'rent') payload.rent_period = data.rent_period;
    if (data.area_id) payload.area_id = data.area_id;
    if (data.landmark_note) payload.landmark_note = data.landmark_note;
    if (data.bedrooms) payload.bedrooms = Number(data.bedrooms);
    if (data.bathrooms) payload.bathrooms = Number(data.bathrooms);
    if (data.toilets) payload.toilets = Number(data.toilets);
    if (data.sitting_rooms) payload.sitting_rooms = Number(data.sitting_rooms);
    if (data.floor_area_sqm) payload.floor_area_sqm = Number(data.floor_area_sqm);
    if (data.land_area_sqm) payload.land_area_sqm = Number(data.land_area_sqm);
    if (data.year_built) payload.year_built = Number(data.year_built);
    if (data.parking_spaces) payload.parking_spaces = Number(data.parking_spaces);
    if (data.agency_fee_pct) payload.agency_fee_pct = Number(data.agency_fee_pct);
    if (data.caution_fee_naira) payload.caution_fee_kobo = Math.round(Number(data.caution_fee_naira) * 100);
    if (data.service_charge_naira) payload.service_charge_kobo = Math.round(Number(data.service_charge_naira) * 100);
    if (data.legal_fee_naira) payload.legal_fee_kobo = Math.round(Number(data.legal_fee_naira) * 100);

    try {
      await updateProperty({ id, data: payload }).unwrap();
      setSuccess('Property updated successfully.');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setApiError(apiErr?.data?.message || 'Failed to update property.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl animate-pulse space-y-6">
        <div className="h-8 bg-border/50 rounded w-1/3" />
        <div className="h-64 bg-border/50 rounded-xl" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Property not found.</p>
      </div>
    );
  }

  const fieldError = (name: keyof ListingFormData) => {
    const err = errors[name];
    return err?.message ? <p className="text-error text-xs mt-1">{err.message as string}</p> : null;
  };

  const inputClass = 'w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:border-accent-dark text-text-primary text-sm';
  const labelClass = 'block text-sm font-medium text-text-secondary mb-1.5';

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-text-primary mb-1">Edit Listing</h1>
      <p className="text-sm text-text-muted mb-6">Update your property details below.</p>

      {success && <div className="bg-success/10 text-success p-3 rounded-xl mb-6 text-sm">{success}</div>}
      {apiError && <div className="bg-error/10 text-error p-3 rounded-xl mb-6 text-sm">{apiError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">Basic Information</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['rent', 'sale'] as ListingType[]).map((type) => (
              <button key={type} type="button" onClick={() => setValue('listing_type', type)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${form.listing_type === type ? 'bg-primary text-white border-primary' : 'bg-background text-text-secondary border-border'}`}>
                {type === 'rent' ? 'For Rent' : 'For Sale'}
              </button>
            ))}
          </div>
          <div>
            <label className={labelClass}>Property Type</label>
            <select {...register('property_type_id')} className={inputClass}>
              <option value="">Select...</option>
              {propertyTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {fieldError('property_type_id')}
          </div>
          <div><label className={labelClass}>Title</label><input type="text" {...register('title')} className={inputClass} />{fieldError('title')}</div>
          <div><label className={labelClass}>Description</label><textarea rows={4} {...register('description')} className={inputClass} />{fieldError('description')}</div>
        </section>

        {/* Pricing */}
        <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">Pricing</h2>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">₦</span>
            <input type="number" min="0" {...register('price_naira')} className={`${inputClass} pl-8`} />
          </div>
          {fieldError('price_naira')}
          <label className="flex items-center gap-2"><input type="checkbox" {...register('price_negotiable')} className="w-4 h-4" /><span className="text-sm text-text-secondary">Negotiable</span></label>
          {form.listing_type === 'rent' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Rent Period</label><select {...register('rent_period')} className={inputClass}><option value="yearly">Yearly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></div>
              <div><label className={labelClass}>Agency Fee (%)</label><input type="number" {...register('agency_fee_pct')} className={inputClass} /></div>
            </div>
          )}
        </section>

        {/* Location */}
        <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">Location</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>State</label><select {...register('state_id')} onChange={(e) => { setValue('state_id', e.target.value); setValue('city_id', ''); setValue('area_id', ''); }} className={inputClass}><option value="">Select...</option>{states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{fieldError('state_id')}</div>
            <div><label className={labelClass}>City</label><select {...register('city_id')} onChange={(e) => { setValue('city_id', e.target.value); setValue('area_id', ''); }} disabled={!form.state_id} className={inputClass}><option value="">Select...</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{fieldError('city_id')}</div>
            <div><label className={labelClass}>Area</label><select {...register('area_id')} disabled={!form.city_id} className={inputClass}><option value="">Select...</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          </div>
          <div><label className={labelClass}>Address</label><input type="text" {...register('address')} className={inputClass} />{fieldError('address')}</div>
          <div><label className={labelClass}>Landmark</label><input type="text" {...register('landmark_note')} className={inputClass} /></div>
        </section>

        {/* Details */}
        <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">Details</h2>
          <div className="grid grid-cols-4 gap-4">
            <div><label className={labelClass}>Bed</label><input type="number" min="0" {...register('bedrooms')} className={inputClass} /></div>
            <div><label className={labelClass}>Bath</label><input type="number" min="0" {...register('bathrooms')} className={inputClass} /></div>
            <div><label className={labelClass}>Toilet</label><input type="number" min="0" {...register('toilets')} className={inputClass} /></div>
            <div><label className={labelClass}>Sitting</label><input type="number" min="0" {...register('sitting_rooms')} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>Floor (sqm)</label><input type="number" {...register('floor_area_sqm')} className={inputClass} /></div>
            <div><label className={labelClass}>Furnishing</label><select {...register('furnishing')} className={inputClass}>{FURNISHING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label className={labelClass}>Year Built</label><input type="number" {...register('year_built')} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'has_bq' as const, label: 'BQ' },{ key: 'has_swimming_pool' as const, label: 'Pool' },{ key: 'has_gym' as const, label: 'Gym' },
              { key: 'has_cctv' as const, label: 'CCTV' },{ key: 'has_generator' as const, label: 'Generator' },{ key: 'has_water_supply' as const, label: 'Water' },
              { key: 'has_prepaid_meter' as const, label: 'Meter' },{ key: 'is_serviced' as const, label: 'Serviced' },{ key: 'is_new_build' as const, label: 'New Build' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2"><input type="checkbox" {...register(key)} className="w-4 h-4" /><span className="text-sm text-text-secondary">{label}</span></label>
            ))}
          </div>
        </section>

        <button type="submit" disabled={saving} className="w-full bg-accent hover:bg-accent-dark text-primary py-3 rounded-xl font-semibold transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
