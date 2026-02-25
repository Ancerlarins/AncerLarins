'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreatePropertyRequestMutation } from '@/store/api/requestApi';
import { propertyRequestSchema, type PropertyRequestFormData } from '@/lib/schemas/property-request';
import type { ListingType } from '@/types';

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'rent', label: 'Rent' },
  { value: 'sale', label: 'Buy' },
  { value: 'short_let', label: 'Short Let' },
];

export default function CreateRequestForm({ onSuccess, onCancel }: Props) {
  const [createRequest, { isLoading }] = useCreatePropertyRequestMutation();
  const [apiError, setApiError] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PropertyRequestFormData>({
    resolver: zodResolver(propertyRequestSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      listing_type: 'rent',
    },
  });

  const listingType = watch('listing_type');

  const onSubmit = async (data: PropertyRequestFormData) => {
    setApiError('');
    // Strip empty optional fields
    const payload = { ...data };
    if (!payload.min_bedrooms) delete payload.min_bedrooms;
    if (!payload.max_bedrooms) delete payload.max_bedrooms;
    if (!payload.budget_kobo) delete payload.budget_kobo;
    if (!payload.move_in_date) delete payload.move_in_date;

    try {
      await createRequest(payload).unwrap();
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setApiError(e?.data?.message || 'Failed to create request.');
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50';
  const errorClass = 'text-xs text-error mt-0.5';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {apiError}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Title *</label>
        <input
          type="text"
          {...register('title')}
          placeholder="e.g. Looking for 2-bed apartment in Lekki"
          className={inputClass}
        />
        {errors.title && <p className={errorClass}>{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Description *</label>
        <textarea
          {...register('description')}
          placeholder="Describe what you're looking for in detail..."
          rows={4}
          className={inputClass}
        />
        {errors.description && <p className={errorClass}>{errors.description.message}</p>}
      </div>

      {/* Listing Type */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">I want to</label>
        <div className="flex gap-2">
          {LISTING_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue('listing_type', t.value, { shouldValidate: true })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                listingType === t.value
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-background'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms & Budget row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Min Bedrooms</label>
          <input
            type="number"
            min={0}
            max={20}
            {...register('min_bedrooms')}
            className={inputClass}
          />
          {errors.min_bedrooms && <p className={errorClass}>{errors.min_bedrooms.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Max Bedrooms</label>
          <input
            type="number"
            min={0}
            max={20}
            {...register('max_bedrooms')}
            className={inputClass}
          />
          {errors.max_bedrooms && <p className={errorClass}>{errors.max_bedrooms.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Budget (₦)</label>
          <input
            type="number"
            min={0}
            {...register('budget_kobo', {
              setValueAs: (v) => (v ? Number(v) * 100 : undefined),
            })}
            placeholder="e.g. 2000000"
            className={inputClass}
          />
        </div>
      </div>

      {/* Move-in date */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Preferred Move-in Date</label>
        <input
          type="date"
          {...register('move_in_date')}
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-accent text-primary px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Post Request'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-sm font-medium border border-border text-text-secondary hover:bg-surface transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
