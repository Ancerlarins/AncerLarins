import { z } from 'zod';

const NIGERIAN_PHONE = /^(\+?234|0)[789][01]\d{8}$/;

export const loginSchema = z.object({
  phone: z.string().regex(NIGERIAN_PHONE, 'Enter a valid Nigerian phone number (e.g. 08012345678)'),
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be digits only'),
});

export const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters').max(50),
  last_name: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  phone: z.string().regex(NIGERIAN_PHONE, 'Enter a valid Nigerian phone number (e.g. 08012345678)'),
  role: z.enum(['user', 'agent']),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
