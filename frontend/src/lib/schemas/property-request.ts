import { z } from 'zod';

export const propertyRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  listing_type: z.enum(['rent', 'sale', 'short_let']),
  min_bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  max_bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  budget_kobo: z.coerce.number().int().min(0).optional(),
  move_in_date: z.string().optional(),
});

export type PropertyRequestFormData = z.infer<typeof propertyRequestSchema>;
