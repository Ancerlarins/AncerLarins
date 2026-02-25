import { z } from 'zod';

const NIGERIAN_PHONE = /^(\+?234|0)[789][01]\d{8}$/;

/** Base fields shared by both guest and authenticated schemas. */
const baseFields = {
  budget_range: z.string().optional(),
  timeline: z.enum(['', 'immediately', '1_3_months', '3_6_months', '6_12_months', 'just_browsing']).optional(),
  financing_type: z.enum(['', 'cash', 'mortgage', 'undecided']).optional(),
  message: z.string().max(1000, 'Message cannot exceed 1000 characters').optional(),
};

/** Guest schema — name, email, phone are required. */
export const inquirySchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(NIGERIAN_PHONE, 'Enter a valid Nigerian phone number'),
  ...baseFields,
});

/** Authenticated schema — contact fields are optional (backend fills from profile). */
export const inquirySchemaAuthenticated = z.object({
  full_name: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  phone: z.string().regex(NIGERIAN_PHONE, 'Enter a valid Nigerian phone number').optional().or(z.literal('')),
  ...baseFields,
});

export type InquiryFormData = z.infer<typeof inquirySchema>;
export type InquiryFormDataAuthenticated = z.infer<typeof inquirySchemaAuthenticated>;
