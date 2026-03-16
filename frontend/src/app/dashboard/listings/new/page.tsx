'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema, type ListingFormData } from '@/lib/schemas/listing';
import { useCreatePropertyMutation } from '@/store/api/propertyApi';
import { useUploadPropertyImagesMutation, useUploadPropertyVideoMutation } from '@/store/api/agentApi';
import { useGetStatesQuery, useGetCitiesQuery, useGetAreasQuery, useGetPropertyTypesQuery } from '@/store/api/locationApi';
import ImageUploader from '@/components/dashboard/ImageUploader';
import type { ImageFile } from '@/components/dashboard/ImageUploader';
import type { CreatePropertyPayload, ListingType, Furnishing } from '@/types';

const STEPS = ['Basic Info', 'Pricing', 'Location', 'Details', 'Photos', 'Video', 'Review'];

const MAX_VIDEO_SIZE_MB = 50;
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

const FURNISHING_OPTIONS: { value: Furnishing; label: string }[] = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'furnished', label: 'Furnished' },
];

// Fields to validate per step
const STEP_FIELDS: (keyof ListingFormData)[][] = [
  ['listing_type', 'property_type_id', 'title', 'description'],
  ['price_naira', 'rent_period'],
  ['state_id', 'city_id', 'address'],
  ['bedrooms', 'bathrooms', 'furnishing'],
  [], // Photos — no form fields
  [], // Video — no form fields
  [], // Review — no additional validation
];

export default function NewListingPage() {
  const router = useRouter();
  const [createProperty, { isLoading: creating }] = useCreatePropertyMutation();
  const [uploadImages, { isLoading: uploading }] = useUploadPropertyImagesMutation();
  const [uploadVideo, { isLoading: uploadingVideo }] = useUploadPropertyVideoMutation();
  const { data: statesData } = useGetStatesQuery();
  const { data: propertyTypesData } = useGetPropertyTypesQuery();

  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoError, setVideoError] = useState('');

  const { register, handleSubmit: rhfSubmit, watch, setValue, trigger, formState: { errors } } = useForm<ListingFormData>({
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

  const { data: citiesData } = useGetCitiesQuery(form.state_id, { skip: !form.state_id });
  const { data: areasData } = useGetAreasQuery(form.city_id, { skip: !form.city_id });

  const states = statesData?.data || [];
  const cities = citiesData?.data || [];
  const areas = areasData?.data || [];
  const propertyTypes = propertyTypesData?.data || [];

  const nextStep = async () => {
    setApiError('');
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || await trigger(fields);
    if (valid) setStep(step + 1);
  };

  const prevStep = () => {
    setApiError('');
    setStep(Math.max(0, step - 1));
  };

  const buildPayload = (data: ListingFormData): CreatePropertyPayload => {
    const payload: CreatePropertyPayload = {
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
      inspection_available: data.inspection_available,
      has_bq: data.has_bq,
      has_swimming_pool: data.has_swimming_pool,
      has_gym: data.has_gym,
      has_cctv: data.has_cctv,
      has_generator: data.has_generator,
      has_water_supply: data.has_water_supply,
      has_prepaid_meter: data.has_prepaid_meter,
      is_serviced: data.is_serviced,
      is_new_build: data.is_new_build,
    };
    if (data.listing_type === 'rent' || data.listing_type === 'short_let') payload.rent_period = data.rent_period;
    if (data.listing_type === 'short_let') {
      if (data.min_stay_days) payload.min_stay_days = Number(data.min_stay_days);
      if (data.max_stay_days) payload.max_stay_days = Number(data.max_stay_days);
      if (data.check_in_time) payload.check_in_time = data.check_in_time;
      if (data.check_out_time) payload.check_out_time = data.check_out_time;
    }
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
    return payload;
  };

  const uploadImagesForProperty = async (propertyId: string) => {
    const formData = new FormData();
    images.forEach((img) => formData.append('images[]', img.file));
    await uploadImages({ propertyId, formData }).unwrap();
  };

  const uploadVideoForProperty = async (propertyId: string) => {
    if (!videoFile) return;
    const formData = new FormData();
    formData.append('video', videoFile);
    await uploadVideo({ propertyId, formData }).unwrap();
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setVideoError('Please select an MP4, MOV, or WebM file.');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setVideoError(`Video must be under ${MAX_VIDEO_SIZE_MB}MB.`);
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    setVideoError('');
  };

  const handleSaveDraft = async () => {
    setApiError('');
    try {
      const payload = buildPayload(form);
      const result = await createProperty({ ...payload, status: 'draft' as never }).unwrap();
      if (result.data?.id) {
        if (images.length > 0) await uploadImagesForProperty(result.data.id);
        if (videoFile) await uploadVideoForProperty(result.data.id);
      }
      router.push('/dashboard/listings');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setApiError(apiErr?.data?.message || 'Failed to save draft.');
    }
  };

  const onSubmit = async (data: ListingFormData) => {
    setApiError('');
    try {
      const payload = buildPayload(data);
      const result = await createProperty(payload).unwrap();
      if (result.data?.id) {
        if (images.length > 0) await uploadImagesForProperty(result.data.id);
        if (videoFile) await uploadVideoForProperty(result.data.id);
      }
      router.push('/dashboard/listings');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      if (apiErr?.data?.errors) {
        const firstErr = Object.values(apiErr.data.errors)[0]?.[0];
        setApiError(firstErr || apiErr?.data?.message || 'Failed to create listing.');
      } else {
        setApiError(apiErr?.data?.message || 'Failed to create listing.');
      }
    }
  };

  const fieldError = (name: keyof ListingFormData) => {
    const err = errors[name];
    return err?.message ? <p className="text-error text-xs mt-1">{err.message as string}</p> : null;
  };

  const inputClass = 'w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:border-accent-dark text-text-primary text-sm';
  const labelClass = 'block text-sm font-medium text-text-secondary mb-1.5';

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-text-primary mb-1">Create New Listing</h1>
      <p className="text-sm text-text-muted mb-6">Fill in the details step by step to publish your property.</p>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => i < step && setStep(i)}
            className={`flex items-center gap-2 shrink-0 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'bg-success text-white' :
              i === step ? 'bg-primary text-white' :
              'bg-border text-text-muted'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${i === step ? 'text-text-primary' : 'text-text-muted'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
          </button>
        ))}
      </div>

      {apiError && (
        <div className="bg-error/10 text-error p-3 rounded-xl mb-6 text-sm">{apiError}</div>
      )}

      {/* Step 0: Basic Info */}
      {step === 0 && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">Basic Information</h2>

          <div>
            <label className={labelClass}>Listing Type</label>
            <div className="grid grid-cols-3 gap-2">
              {([['rent', 'For Rent'], ['sale', 'For Sale'], ['short_let', 'Short Let']] as [ListingType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setValue('listing_type', type);
                    if (type === 'short_let') setValue('rent_period', 'daily');
                    else if (type === 'rent') setValue('rent_period', 'yearly');
                  }}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    form.listing_type === type
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background text-text-secondary border-border hover:border-accent-dark'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Property Type *</label>
            <select {...register('property_type_id')} className={inputClass}>
              <option value="">Select type...</option>
              {propertyTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {fieldError('property_type_id')}
          </div>

          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" {...register('title')} placeholder="e.g. Spacious 3 Bedroom Apartment in Lekki Phase 1" className={inputClass} />
            {fieldError('title')}
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea rows={5} {...register('description')} placeholder="Describe the property in detail..." className={inputClass} />
            {fieldError('description')}
          </div>
        </div>
      )}

      {/* Step 1: Pricing */}
      {step === 1 && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">Pricing</h2>

          <div>
            <label className={labelClass}>Price (NGN) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">₦</span>
              <input type="number" min="0" {...register('price_naira')} placeholder="3,500,000" className={`${inputClass} pl-8`} />
            </div>
            {fieldError('price_naira')}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('price_negotiable')} className="w-4 h-4 text-accent-dark border-border rounded" />
            <span className="text-sm text-text-secondary">Price is negotiable</span>
          </label>

          {(form.listing_type === 'rent' || form.listing_type === 'short_let') && (
            <>
              <div>
                <label className={labelClass}>Rent Period</label>
                <select {...register('rent_period')} className={inputClass}>
                  {form.listing_type === 'short_let' ? (
                    <>
                      <option value="daily">Per Night</option>
                      <option value="weekly">Per Week</option>
                    </>
                  ) : (
                    <>
                      <option value="yearly">Per Year</option>
                      <option value="monthly">Per Month</option>
                      <option value="quarterly">Per Quarter</option>
                    </>
                  )}
                </select>
              </div>

              {form.listing_type === 'short_let' && (
                <>
                  <h3 className="text-sm font-medium text-text-primary pt-2">Short Let Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Min Stay (nights)</label>
                      <input type="number" min="1" {...register('min_stay_days')} placeholder="1" className={inputClass} />
                      {fieldError('min_stay_days')}
                    </div>
                    <div>
                      <label className={labelClass}>Max Stay (nights)</label>
                      <input type="number" min="1" {...register('max_stay_days')} placeholder="90" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Check-in Time</label>
                      <input type="time" {...register('check_in_time')} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Check-out Time</label>
                      <input type="time" {...register('check_out_time')} className={inputClass} />
                    </div>
                  </div>
                </>
              )}

              <h3 className="text-sm font-medium text-text-primary pt-2">Additional Costs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Agency Fee (%)</label>
                  <input type="number" min="0" max="100" {...register('agency_fee_pct')} className={inputClass} />
                  {fieldError('agency_fee_pct')}
                </div>
                <div>
                  <label className={labelClass}>Caution Fee (NGN)</label>
                  <input type="number" min="0" {...register('caution_fee_naira')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Service Charge (NGN)</label>
                  <input type="number" min="0" {...register('service_charge_naira')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Legal Fee (NGN)</label>
                  <input type="number" min="0" {...register('legal_fee_naira')} className={inputClass} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">Location</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>State *</label>
              <select
                {...register('state_id')}
                onChange={(e) => { setValue('state_id', e.target.value); setValue('city_id', ''); setValue('area_id', ''); }}
                className={inputClass}
              >
                <option value="">Select state...</option>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {fieldError('state_id')}
            </div>
            <div>
              <label className={labelClass}>City *</label>
              <select
                {...register('city_id')}
                onChange={(e) => { setValue('city_id', e.target.value); setValue('area_id', ''); }}
                disabled={!form.state_id}
                className={inputClass}
              >
                <option value="">Select city...</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {fieldError('city_id')}
            </div>
            <div>
              <label className={labelClass}>Area</label>
              <select {...register('area_id')} disabled={!form.city_id} className={inputClass}>
                <option value="">Select area...</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Address *</label>
            <input type="text" {...register('address')} placeholder="e.g. 15 Admiralty Way, Lekki Phase 1" className={inputClass} />
            {fieldError('address')}
          </div>

          <div>
            <label className={labelClass}>Landmark Note</label>
            <input type="text" {...register('landmark_note')} placeholder="e.g. Opposite Chevron, near Lekki toll gate" className={inputClass} />
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">Property Details</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><label className={labelClass}>Bedrooms</label><input type="number" min="0" {...register('bedrooms')} className={inputClass} /></div>
            <div><label className={labelClass}>Bathrooms</label><input type="number" min="0" {...register('bathrooms')} className={inputClass} /></div>
            <div><label className={labelClass}>Toilets</label><input type="number" min="0" {...register('toilets')} className={inputClass} /></div>
            <div><label className={labelClass}>Sitting Rooms</label><input type="number" min="0" {...register('sitting_rooms')} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>Floor Area (sqm)</label><input type="number" min="0" {...register('floor_area_sqm')} className={inputClass} /></div>
            <div><label className={labelClass}>Land Area (sqm)</label><input type="number" min="0" {...register('land_area_sqm')} className={inputClass} /></div>
            <div><label className={labelClass}>Parking Spaces</label><input type="number" min="0" {...register('parking_spaces')} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Furnishing</label>
              <select {...register('furnishing')} className={inputClass}>
                {FURNISHING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Year Built</label><input type="number" min="1900" max="2026" {...register('year_built')} className={inputClass} /></div>
          </div>

          <h3 className="text-sm font-medium text-text-primary pt-2">Features & Amenities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'has_bq' as const, label: 'BQ (Boys Quarter)' },
              { key: 'has_swimming_pool' as const, label: 'Swimming Pool' },
              { key: 'has_gym' as const, label: 'Gym' },
              { key: 'has_cctv' as const, label: 'CCTV Security' },
              { key: 'has_generator' as const, label: 'Generator' },
              { key: 'has_water_supply' as const, label: '24/7 Water' },
              { key: 'has_prepaid_meter' as const, label: 'Prepaid Meter' },
              { key: 'is_serviced' as const, label: 'Serviced' },
              { key: 'is_new_build' as const, label: 'New Build' },
              { key: 'inspection_available' as const, label: 'Inspection Available' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register(key)} className="w-4 h-4 text-accent-dark border-border rounded" />
                <span className="text-sm text-text-secondary">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Photos */}
      {step === 4 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-semibold text-text-primary mb-4">Photos</h2>
          <ImageUploader images={images} onChange={setImages} maxImages={20} maxSizeMB={5} />
        </div>
      )}

      {/* Step 5: Video */}
      {step === 5 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-semibold text-text-primary mb-1">Video Tour</h2>
          <p className="text-sm text-text-muted mb-4">Upload a video walkthrough of your property (optional). Max 50MB, MP4/MOV/WebM.</p>

          {videoError && (
            <div className="bg-error/10 text-error p-3 rounded-xl mb-4 text-sm">{videoError}</div>
          )}

          {videoPreview ? (
            <div className="space-y-3">
              <video
                src={videoPreview}
                controls
                className="w-full rounded-xl border border-border max-h-80"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {videoFile?.name} ({(videoFile!.size / (1024 * 1024)).toFixed(1)} MB)
                </p>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="text-sm text-error hover:text-error/80 font-medium transition-colors"
                >
                  Remove Video
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-dark hover:bg-accent/5 transition-colors">
              <svg className="w-10 h-10 text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <span className="text-sm font-medium text-text-secondary">Click to upload video</span>
              <span className="text-xs text-text-muted mt-1">MP4, MOV, or WebM up to 50MB</span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleVideoSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      {/* Step 6: Review */}
      {step === 6 && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="font-semibold text-text-primary mb-4">Review Your Listing</h2>

            <dl className="space-y-3 text-sm">
              <ReviewRow label="Title" value={form.title} />
              <ReviewRow label="Type" value={`${form.listing_type === 'rent' ? 'For Rent' : form.listing_type === 'short_let' ? 'Short Let' : 'For Sale'}`} />
              <ReviewRow label="Price" value={form.price_naira ? `₦${Number(form.price_naira).toLocaleString()}` : '-'} />
              {form.listing_type === 'rent' && <ReviewRow label="Rent Period" value={form.rent_period} />}
              <ReviewRow label="Address" value={form.address} />
              <ReviewRow label="Bedrooms" value={form.bedrooms || '-'} />
              <ReviewRow label="Bathrooms" value={form.bathrooms || '-'} />
              <ReviewRow label="Furnishing" value={form.furnishing.replace('_', ' ')} />
              <ReviewRow label="Photos" value={`${images.length} images`} />
              <ReviewRow label="Video" value={videoFile ? videoFile.name : 'None'} />
            </dl>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {images.slice(0, 6).map((img) => (
                <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-border/30">
                  <img src={img.preview} alt="Upload preview" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
        <div>
          {step > 0 && (
            <button onClick={prevStep} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface transition-colors">
              Back
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={handleSaveDraft} disabled={creating} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface transition-colors disabled:opacity-50">
            Save Draft
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={nextStep} className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              Continue
            </button>
          ) : (
            <button onClick={rhfSubmit(onSubmit)} disabled={creating || uploading || uploadingVideo} className="bg-accent hover:bg-accent-dark text-primary px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              {creating || uploading || uploadingVideo ? 'Submitting...' : 'Submit for Approval'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text-primary font-medium capitalize">{value}</dd>
    </div>
  );
}
