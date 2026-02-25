'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSubmitInquiryMutation } from '@/store/api/inquiryApi';
import { useSavePropertyMutation } from '@/store/api/propertyApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { getLeadSource, formatPrice } from '@/lib/utils';
import { inquirySchema, inquirySchemaAuthenticated } from '@/lib/schemas/inquiry';
import type { InquiryFormData } from '@/lib/schemas/inquiry';
import type { PropertyDetail } from '@/types';

interface InquiryFormProps {
  property: PropertyDetail;
}

const BUDGET_OPTIONS = [
  { value: '', label: 'Select budget range' },
  { value: '₦50M-₦100M', label: '₦50M - ₦100M' },
  { value: '₦100M-₦300M', label: '₦100M - ₦300M' },
  { value: '₦300M-₦500M', label: '₦300M - ₦500M' },
  { value: '₦500M-₦1B', label: '₦500M - ₦1B' },
  { value: '₦1B+', label: '₦1B+' },
];

const TIMELINE_OPTIONS = [
  { value: '', label: 'Select timeline' },
  { value: 'immediately', label: 'Immediately' },
  { value: '1_3_months', label: '1-3 months' },
  { value: '3_6_months', label: '3-6 months' },
  { value: '6_12_months', label: '6-12 months' },
  { value: 'just_browsing', label: 'Just browsing' },
];

export default function InquiryForm({ property }: InquiryFormProps) {
  const { user } = useAuth();
  const [submitInquiry] = useSubmitInquiryMutation();
  const [saveProperty] = useSavePropertyMutation();
  const { toast } = useToast();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingRef, setTrackingRef] = useState('');
  const [loading, setLoading] = useState(false);

  const schema = user ? inquirySchemaAuthenticated : inquirySchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors } } = useForm<InquiryFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      full_name: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
      email: user?.email || '',
      phone: user?.phone || '',
      budget_range: '',
      timeline: '',
      financing_type: '',
      message: '',
    },
  });

  const onSubmit = useCallback(async (data: InquiryFormData) => {
    if (loading || !property.id) return;
    setLoading(true);
    try {
      const res = await submitInquiry({
        property_id: property.id,
        full_name: data.full_name || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        budget_range: data.budget_range || undefined,
        timeline: data.timeline || undefined,
        financing_type: data.financing_type || undefined,
        message: data.message || undefined,
        source: getLeadSource(),
      }).unwrap();
      setTrackingRef(res.data.tracking_ref || '');
      setSubmitted(true);
      setMobileOpen(false);
    } catch {
      toast('Could not submit inquiry. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [submitInquiry, property.id, loading, toast]);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-dark/30 focus:border-accent-dark';
  const errorClass = 'text-xs text-error mt-0.5';

  const formFields = (
    <>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Full Name *</label>
        <input type="text" {...register('full_name')} placeholder="Your full name" className={inputClass} />
        {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Phone *</label>
        <input type="tel" {...register('phone')} placeholder="08012345678" className={inputClass} />
        {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Email *</label>
        <input type="email" {...register('email')} placeholder="you@example.com" className={inputClass} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Budget Range</label>
        <select {...register('budget_range')} className={inputClass}>
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Timeline</label>
        <select {...register('timeline')} className={inputClass}>
          {TIMELINE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Financing</label>
        <div className="flex gap-3">
          {(['cash', 'mortgage', 'undecided'] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" value={opt} {...register('financing_type')} className="accent-accent-dark" />
              <span className="text-sm text-text-secondary capitalize">{opt}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Message (optional)</label>
        <textarea
          {...register('message')}
          placeholder="Any questions or preferences..."
          rows={3}
          maxLength={1000}
          className={`${inputClass} resize-none`}
        />
        {errors.message && <p className={errorClass}>{errors.message.message}</p>}
      </div>
    </>
  );

  const successMessage = (
    <div className="text-center py-6 px-4">
      <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-success" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">Thank You!</h3>
      <p className="text-sm text-text-muted mb-4">Our team will call you within 2 hours to arrange your private viewing.</p>
      {trackingRef && (
        <div className="bg-background border border-border rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Your tracking reference</p>
          <p className="text-lg font-mono font-bold text-accent tracking-wider">{trackingRef}</p>
          <a href={`/track-inquiry?ref=${trackingRef}`} className="text-xs text-accent hover:underline mt-1 inline-block">
            Track your inquiry status
          </a>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Card */}
      <div className="hidden lg:block">
        <div className="bg-surface rounded-xl border border-border p-6 sticky top-24">
          {/* Property recap */}
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-sm text-text-muted truncate">{property.title}</p>
            <p className="text-xl font-bold text-accent-dark">{formatPrice(property.price_kobo)}</p>
          </div>

          {submitted ? successMessage : (
            <>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-accent-dark rounded-full" />
                <h3 className="font-semibold text-text-primary">Request Private Viewing</h3>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {formFields}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-accent-dark hover:bg-accent disabled:opacity-70 text-white py-3.5 rounded-xl font-semibold text-base transition-colors"
                >
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                  Request Viewing
                </button>
              </form>
            </>
          )}

          {/* Save Button */}
          <button
            onClick={async () => {
              if (!property.id) return;
              try {
                await saveProperty(property.id).unwrap();
                toast('Property saved!', 'success');
              } catch {
                toast('Could not save property', 'error');
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-surface border border-border hover:border-accent-dark text-text-secondary py-3 rounded-xl font-medium text-sm transition-colors mt-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            Save Property
          </button>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-4 py-3">
        {submitted ? (
          <p className="text-center text-sm text-success font-medium py-1">
            Inquiry submitted — we&apos;ll call you soon!
          </p>
        ) : (
          <button
            onClick={() => setMobileOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-accent-dark hover:bg-accent text-white py-3.5 rounded-xl font-semibold text-base transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Request Private Viewing
          </button>
        )}
      </div>

      {/* Mobile Slide-Up Modal */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full bg-surface rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="px-5 pb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-accent-dark rounded-full" />
                  <h3 className="font-semibold text-text-primary">Request Private Viewing</h3>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-text-muted hover:text-text-primary text-2xl leading-none">&times;</button>
              </div>

              <div className="mb-4 pb-3 border-b border-border">
                <p className="text-sm text-text-muted truncate">{property.title}</p>
                <p className="text-lg font-bold text-accent-dark">{formatPrice(property.price_kobo)}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {formFields}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-accent-dark hover:bg-accent disabled:opacity-70 text-white py-3.5 rounded-xl font-semibold text-base transition-colors"
                >
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  Request Viewing
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
