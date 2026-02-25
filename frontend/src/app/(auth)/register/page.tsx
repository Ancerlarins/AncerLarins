'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegisterMutation, useVerifyOtpMutation } from '@/store/api/authApi';
import { useAuth, getRoleRedirect } from '@/hooks/useAuth';
import { registerSchema, otpSchema, type RegisterFormData, type OtpFormData } from '@/lib/schemas/auth';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginSuccess } = useAuth();
  const [registerApi, { isLoading: regLoading }] = useRegisterMutation();
  const [verifyOtp, { isLoading: otpLoading }] = useVerifyOtpMutation();

  const defaultRole = (searchParams.get('role') || 'user') as 'user' | 'agent';

  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [phone, setPhone] = useState('');
  const [apiError, setApiError] = useState('');

  const infoForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      role: defaultRole,
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const role = infoForm.watch('role');

  const handleRegister = async (data: RegisterFormData) => {
    setApiError('');
    try {
      await registerApi(data).unwrap();
      setPhone(data.phone);
      setStep('otp');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      if (apiErr?.data?.errors) {
        const firstErr = Object.values(apiErr.data.errors)[0]?.[0];
        setApiError(firstErr || apiErr?.data?.message || 'Registration failed.');
      } else {
        setApiError(apiErr?.data?.message || 'Registration failed.');
      }
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    setApiError('');
    try {
      const result = await verifyOtp({ phone, code: data.otp, purpose: 'registration' }).unwrap();
      if (result.data) {
        loginSuccess(result.data.user);
        router.push(getRoleRedirect(result.data.user.role));
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setApiError(apiErr?.data?.message || 'Invalid OTP.');
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:border-accent-dark text-text-primary';
  const errorClass = 'text-xs text-error mt-1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-sm p-8 border border-border">
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <Image src="/images/logo-cropped.png" alt="AncerLarins" width={40} height={40} className="h-10 w-auto" />
          <span className="text-2xl font-bold text-accent-dark">Ancer</span>
          <span className="text-2xl font-bold text-text-primary">Larins</span>
        </Link>

        <h1 className="text-xl font-semibold text-text-primary mb-2">
          {step === 'info' ? 'Create your account' : 'Verify your phone'}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {step === 'info'
            ? 'Join AncerLarins to find your perfect property'
            : `Enter the 6-digit code sent to ${phone}`}
        </p>

        {apiError && (
          <div className="bg-error/10 text-error p-3 rounded-lg mb-4 text-sm">{apiError}</div>
        )}

        {step === 'info' ? (
          <form onSubmit={infoForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">First Name</label>
                <input type="text" {...infoForm.register('first_name')} className={inputClass} />
                {infoForm.formState.errors.first_name && <p className={errorClass}>{infoForm.formState.errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Last Name</label>
                <input type="text" {...infoForm.register('last_name')} className={inputClass} />
                {infoForm.formState.errors.last_name && <p className={errorClass}>{infoForm.formState.errors.last_name.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone Number</label>
              <input
                type="tel"
                {...infoForm.register('phone')}
                placeholder="+234 801 234 5678"
                className={inputClass}
              />
              {infoForm.formState.errors.phone && <p className={errorClass}>{infoForm.formState.errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => infoForm.setValue('role', 'user', { shouldValidate: true })}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${role === 'user' ? 'bg-primary text-white border-primary' : 'bg-background text-text-secondary border-border hover:border-accent-dark'}`}
                >
                  Buyer / Tenant
                </button>
                <button
                  type="button"
                  onClick={() => infoForm.setValue('role', 'agent', { shouldValidate: true })}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${role === 'agent' ? 'bg-primary text-white border-primary' : 'bg-background text-text-secondary border-border hover:border-accent-dark'}`}
                >
                  Agent
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={regLoading}
              className="w-full bg-accent hover:bg-accent-dark text-primary py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {regLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Verification Code</label>
              <input
                type="text"
                maxLength={6}
                {...otpForm.register('otp', {
                  onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, ''); },
                })}
                placeholder="000000"
                className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                autoFocus
              />
              {otpForm.formState.errors.otp && <p className={errorClass}>{otpForm.formState.errors.otp.message}</p>}
            </div>
            <button
              type="submit"
              disabled={otpLoading}
              className="w-full bg-accent hover:bg-accent-dark text-primary py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {otpLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('info'); otpForm.reset(); setApiError(''); }}
              className="w-full text-text-muted hover:text-text-secondary text-sm py-2"
            >
              Back to registration
            </button>
          </form>
        )}

        <p className="text-sm text-text-muted mt-8 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-dark font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
