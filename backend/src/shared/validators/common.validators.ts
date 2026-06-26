import { z } from 'zod';

export const emailSchema = z.email({ message: 'Invalid email address' });

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' });

export const aadhaarSchema = z
  .string()
  .trim()
  .regex(/^\d{12}$/, { message: 'Aadhaar must be 12 digits' });

export const panSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN format' });

export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password must not exceed 128 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain a lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain a number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain a special character' });

export const mongoIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, { message: 'Invalid MongoDB ObjectId' });

export const dateSchema = z.coerce.date({ message: 'Invalid date' });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortingSchema = z.object({
  sortBy: z.string().trim().min(1).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  search: z.string().trim().max(200).optional(),
});

export const listQuerySchema = paginationSchema
  .extend(sortingSchema.shape)
  .extend(searchSchema.shape);

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortingInput = z.infer<typeof sortingSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
