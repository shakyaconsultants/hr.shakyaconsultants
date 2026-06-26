import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from '@shared/validators/common.validators.js';

const addressSchema = z
  .object({
    line1: z.string().trim().min(1),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    country: z.string().trim().min(1),
    postalCode: z.string().trim().min(1),
  })
  .strict();

export const bootstrapSchema = z
  .object({
    company: z
      .object({
        name: z.string().trim().min(2).max(200),
        legalName: z.string().trim().min(2).max(200),
        code: z.string().trim().min(2).max(20).toUpperCase(),
        email: emailSchema,
        phone: phoneSchema,
        website: z.url().optional(),
        taxId: z.string().trim().optional(),
        registrationNumber: z.string().trim().optional(),
        address: addressSchema,
        timezone: z.string().trim().default('Asia/Kolkata'),
        currency: z.string().trim().length(3).default('INR'),
        fiscalYearStart: z.string().trim().default('04-01'),
      })
      .strict(),
    branch: z
      .object({
        name: z.string().trim().min(2).max(200).optional(),
        code: z.string().trim().min(2).max(20).toUpperCase().optional(),
        phone: phoneSchema.optional(),
        email: emailSchema.optional(),
        address: addressSchema.optional(),
      })
      .strict()
      .optional(),
    admin: z
      .object({
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        email: emailSchema,
        password: passwordSchema,
        phone: phoneSchema.optional(),
      })
      .strict(),
  })
  .strict();

export type BootstrapInput = z.infer<typeof bootstrapSchema>;
