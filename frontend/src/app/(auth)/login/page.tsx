'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLoginMutation, useVerifyOtpMutation } from '@/store/api/authApi';
import { useAuth, getRoleRedirect } from '@/hooks/useAuth';
import { loginSchema, otpSchema, type LoginFormData, type OtpFormData } from '@/lib/schemas/auth';

export default function LoginPage() {
  const router = useRouter();
  const { loginSuccess } = useAuth();
  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const [verifyOtp, { isLoading: otpLoading }] = useVerifyOtpMutation();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [apiError, setApiError] = useState('');

  const phoneForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const handleSendOtp = async (data: LoginFormData) => {
    setApiError('');
    try {
      await login({ phone: data.phone }).unwrap();
      setPhone(data.phone);
      setStep('otp');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setApiError(apiErr?.data?.message || 'Failed to send OTP. Check your phone number.');
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    setApiError('');
    try {
      const result = await verifyOtp({ phone, code: data.otp, purpose: 'login' }).unwrap();
      if (result.data) {
        loginSuccess(result.data.user);
        router.push(getRoleRedirect(result.data.user.role));
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setApiError(apiErr?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:border-accent-dark text-text-primary';
  const errorClass = 'text-xs text-error mt-1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-sm p-8 border border-border">
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <Image src="/images/logo-cropped.png" alt="AncerLarins" width={40} height={40} className="h-10 w-auto" />
          <span className="text-2xl font-bold text-accent-dark">Ancer</span>
          <span className="text-2xl font-bold text-text-primary">Larins</span>
        </Link>

        <h1 className="text-xl font-semibold text-text-primary mb-2">
          {step === 'phone' ? 'Sign in to your account' : 'Enter verification code'}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {step === 'phone'
            ? 'We\'ll send a verification code to your phone'
            : `We sent a 6-digit code to ${phone}`}
        </p>

        {apiError && (
          <div className="bg-error/10 text-error p-3 rounded-lg mb-4 text-sm">{apiError}</div>
        )}

        {step === 'phone' ? (
          <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone Number</label>
              <input
                type="tel"
                {...phoneForm.register('phone')}
                placeholder="+234 801 234 5678"
                className={inputClass}
              />
              {phoneForm.formState.errors.phone
                ? <p className={errorClass}>{phoneForm.formState.errors.phone.message}</p>
                : <p className="text-xs text-text-muted mt-1">Nigerian phone number (e.g. +2348012345678 or 08012345678)</p>
              }
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-accent hover:bg-accent-dark text-primary py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {loginLoading ? 'Sending code...' : 'Send Verification Code'}
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
              {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); otpForm.reset(); setApiError(''); }}
              className="w-full text-text-muted hover:text-text-secondary text-sm py-2"
            >
              Change phone number
            </button>
          </form>
        )}

        <p className="text-sm text-text-muted mt-8 text-center">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-accent-dark font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
