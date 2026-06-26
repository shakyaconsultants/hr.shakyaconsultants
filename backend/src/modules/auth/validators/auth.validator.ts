import { z } from 'zod';
import { emailSchema } from '@shared/validators/common.validators.js';

export const loginSchema = z
  .object({
    companyCode: z.string().trim().min(1, { message: 'Company code is required' }).toUpperCase(),
    email: emailSchema,
    password: z.string().min(1, { message: 'Password is required' }),
    rememberMe: z.boolean().optional().default(false),
    deviceId: z.string().trim().min(1).optional(),
    deviceName: z.string().trim().max(100).optional(),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().trim().min(1).optional(),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    companyCode: z.string().trim().min(1).toUpperCase(),
    email: emailSchema,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
  })
  .strict();

export const logoutSchema = z
  .object({
    refreshToken: z.string().trim().min(1).optional(),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
