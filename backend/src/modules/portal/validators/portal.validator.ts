import { z } from 'zod';

export const portalTokenParamSchema = z.object({
  token: z.string().min(32),
});

export const portalDraftSchema = z.object({
  section: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

export const activateAccountSchema = z.object({
  password: z.string().min(8),
});
