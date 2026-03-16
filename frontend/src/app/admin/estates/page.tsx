'use client';

import { type JSX, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { estateSchema, parseEstateAmenities, type EstateFormData } from '@/lib/schemas/estate';
import {
  useGetAdminEstatesQuery,
  useCreateEstateMutation,
  useUpdateEstateMutation,
  useDeleteEstateMutation,
} from '@/store/api/estateApi';
import { useGetStatesQuery, useGetCitiesQuery, useGetAreasQuery } from '@/store/api/locationApi';
import type { EstateType, EstateListItem } from '@/types/estate';
import Image from 'next/image';

const ESTATE_TYPE_OPTIONS: { value: EstateType; label: string }[] = [
  { value: 'gated_estate', label: 'Gated Estate' },
  { value: 'open_estate', label: 'Open Estate' },
  { value: 'highrise', label: 'Highrise' },
  { value: 'mixed_use', label: 'Mixed Use' },
];

const ESTATE_TYPE_ICONS: Record<EstateType, JSX.Element> = {
  gated_estate: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  open_estate: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
    </svg>
  ),
  highrise: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  mixed_use: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
    </svg>
  ),
};

const DEFAULT_VALUES: EstateFormData = {
  name: '',
  area_id: '',
  estate_type: 'gated_estate',
  description: '',
  developer: '',
  year_built: '',
  total_units: '',
  amenities: '',
  security_type: '',
  service_charge_kobo: '',
  service_charge_period: '',
  electricity_source: '',
  water_source: '',
  cover_image_url: '',
};

export default function AdminEstatesPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useGetAdminEstatesQuery({ page, per_page: 20, ...(searchQuery ? { q: searchQuery } : {}) });
  const [createEstate, { isLoading: creating }] = useCreateEstateMutation();
  const [updateEstate] = useUpdateEstateMutation();
  const [deleteEstate] = useDeleteEstateMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  // Cascading location selects
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const { data: statesData } = useGetStatesQuery();
  const { data: citiesData } = useGetCitiesQuery(selectedState, { skip: !selectedState });
  const { data: areasData } = useGetAreasQuery(selectedCity, { skip: !selectedCity });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EstateFormData>({
    resolver: zodResolver(estateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const estates = data?.data || [];
  const meta = data?.meta;

  const resetForm = () => {
    reset(DEFAULT_VALUES);
    setEditId(null);
    setShowForm(false);
    setSelectedState('');
    setSelectedCity('');
  };

  const onSubmit = async (data: EstateFormData) => {
    const payload = {
      ...data,
      amenities: parseEstateAmenities(data.amenities),
      year_built: data.year_built ? Number(data.year_built) : undefined,
      total_units: data.total_units ? Number(data.total_units) : undefined,
      service_charge_kobo: data.service_charge_kobo ? Number(data.service_charge_kobo) : undefined,
    };

    try {
      if (editId) {
        await updateEstate({ id: editId, data: payload }).unwrap();
      } else {
        await createEstate(payload).unwrap();
      }
      resetForm();
    } catch { /* RTK handles */ }
  };

  const handleEdit = (estate: EstateListItem) => {
    reset({
      name: estate.name,
      area_id: estate.area?.id || '',
      estate_type: estate.estate_type,
      description: '',
      developer: '',
      security_type: estate.security_type || '',
      service_charge_kobo: estate.service_charge_kobo?.toString() || '',
      service_charge_period: estate.service_charge_period || '',
      cover_image_url: estate.cover_image_url || '',
      year_built: '',
      total_units: '',
      amenities: '',
      electricity_source: '',
      water_source: '',
    });
    setEditId(estate.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEstate(id).unwrap();
      setDeleteModal(null);
    } catch { /* RTK handles */ }
  };

  const fieldError = (name: keyof EstateFormData) => {
    const err = errors[name];
    return err?.message ? <p className="text-error text-xs mt-1">{err.message as string}</p> : null;
  };

  const inputClass = 'px-4 py-3 border border-border rounded-xl bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all';

  const totalEstates = meta?.total ?? estates.length;

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-primary/10 rounded-lg p-3">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Estate Management</h1>
            <p className="text-sm text-text-muted">{totalEstates} estate{totalEstates !== 1 ? 's' : ''} registered</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search estates..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>

          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-primary hover:bg-primary-light text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Estate
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface border border-border rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${editId ? 'bg-accent/15' : 'bg-primary/10'}`}>
              {editId ? (
                <svg className="w-5 h-5 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">{editId ? 'Edit Estate' : 'Create New Estate'}</h2>
              <p className="text-xs text-text-muted">{editId ? 'Update estate details below' : 'Fill in the details to add a new estate'}</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              Basic Information
            </div>

            <div>
              <input type="text" placeholder="Estate name" {...register('name')} className={`w-full ${inputClass}`} />
              {fieldError('name')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select {...register('estate_type')} className={inputClass}>
                {ESTATE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input type="text" placeholder="Developer" {...register('developer')} className={inputClass} />
              <input type="number" placeholder="Year built" {...register('year_built')} className={inputClass} />
            </div>

            <textarea placeholder="Description" {...register('description')} rows={3} className={`w-full ${inputClass} resize-none`} />
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              Location
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); setValue('area_id', ''); }}
                className={inputClass}
              >
                <option value="">Select State</option>
                {statesData?.data?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => { setSelectedCity(e.target.value); setValue('area_id', ''); }}
                disabled={!selectedState}
                className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">Select City</option>
                {citiesData?.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <div>
                <select
                  {...register('area_id')}
                  disabled={!selectedCity}
                  className={`${inputClass} w-full disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">Select Area</option>
                  {areasData?.data?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {fieldError('area_id')}
              </div>
            </div>
          </div>

          {/* Infrastructure & Utilities */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
              </svg>
              Infrastructure & Utilities
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input type="number" placeholder="Total units" {...register('total_units')} className={inputClass} />
              <input type="text" placeholder="Security type" {...register('security_type')} className={inputClass} />
              <input type="text" placeholder="Electricity source" {...register('electricity_source')} className={inputClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input type="text" placeholder="Water source" {...register('water_source')} className={inputClass} />
              <input type="number" placeholder="Service charge (kobo)" {...register('service_charge_kobo')} className={inputClass} />
              <input type="text" placeholder="Service charge period (e.g. monthly)" {...register('service_charge_period')} className={inputClass} />
            </div>

            <input type="text" placeholder="Amenities (comma-separated, e.g. Pool, Gym, Playground)" {...register('amenities')} className={`w-full ${inputClass}`} />
          </div>

          {/* Cover Image */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              Cover Image
            </div>
            <div>
              <input type="text" placeholder="Cover image URL" {...register('cover_image_url')} className={`w-full ${inputClass}`} />
              {fieldError('cover_image_url')}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-background/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary-light transition-colors flex items-center gap-2"
            >
              {creating && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {editId ? 'Update Estate' : 'Create Estate'}
            </button>
          </div>
        </form>
      )}

      {/* Estates List */}
      {isLoading ? (
        /* Skeleton cards matching the estate card layout */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="h-32 bg-border/30" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-border/40 rounded" />
                  <div className="h-4 bg-border/40 rounded w-2/3" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 bg-border/30 rounded-full w-20" />
                  <div className="h-5 bg-border/30 rounded-full w-16" />
                </div>
                <div className="flex gap-3">
                  <div className="h-3 bg-border/30 rounded w-20" />
                  <div className="h-3 bg-border/30 rounded w-16" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                  <div className="h-7 bg-border/30 rounded-lg w-14" />
                  <div className="h-7 bg-border/30 rounded-lg w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : estates.length === 0 ? (
        /* Enhanced Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-surface border border-border rounded-2xl">
          <div className="w-16 h-16 bg-border/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">No estates found</h3>
          <p className="text-sm text-text-muted mb-5 text-center max-w-xs">
            {searchQuery
              ? 'No estates match your search. Try adjusting your query.'
              : 'Get started by adding your first estate to the platform.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add First Estate
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Estate Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {estates.map((estate) => (
              <div
                key={estate.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-accent-dark/20 transition-colors group"
              >
                {/* Cover Image or Placeholder */}
                {estate.cover_image_url ? (
                  <div className="relative h-32 bg-border/20 overflow-hidden">
                    <Image
                      src={estate.cover_image_url}
                      alt={estate.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {/* Estate type badge on image */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/90 backdrop-blur-sm text-text-primary px-2.5 py-1 rounded-lg shadow-sm capitalize">
                        {ESTATE_TYPE_ICONS[estate.estate_type]}
                        {estate.estate_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center relative">
                    <svg className="w-10 h-10 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    {/* Estate type badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-accent/15 text-accent-dark px-2.5 py-1 rounded-lg capitalize">
                        {ESTATE_TYPE_ICONS[estate.estate_type]}
                        {estate.estate_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-text-primary truncate">{estate.name}</h3>
                    {estate.area && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        <span className="text-xs text-text-muted truncate">{estate.area.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5M10.5 21V8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                      <span>{estate.properties_count ?? 0} properties</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                      <span>{estate.reviews_count ?? 0} reviews</span>
                    </div>
                    {estate.avg_rating != null && (
                      <div className="flex items-center gap-1 text-xs font-medium text-accent-dark ml-auto">
                        <svg className="w-3.5 h-3.5 text-accent-dark fill-accent-dark" viewBox="0 0 24 24">
                          <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                        {estate.avg_rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                    <button
                      onClick={() => handleEdit(estate)}
                      className="text-xs text-primary hover:bg-primary/10 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteModal(estate.id)}
                      className="text-xs text-error hover:bg-error/10 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-text-muted">
                Page <span className="font-medium text-text-secondary">{meta.current_page}</span> of <span className="font-medium text-text-secondary">{meta.last_page}</span> ({meta.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-background/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(meta.last_page, page + 1))}
                  disabled={page === meta.last_page}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-background/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-border">
            {/* Centered icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
            </div>

            <h3 className="font-semibold text-text-primary text-center text-lg mb-1">Delete Estate</h3>
            <p className="text-sm text-text-muted text-center mb-4">Are you sure you want to delete this estate? This action cannot be undone.</p>

            {/* Warning callout */}
            <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 mb-5">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-error shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p className="text-xs text-error/80">All associated data including reviews and property links will be permanently removed.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDelete(deleteModal)}
                className="w-full px-4 py-2.5 rounded-xl bg-error text-white text-sm font-medium hover:bg-error/90 transition-colors"
              >
                Delete Estate
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-background/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
