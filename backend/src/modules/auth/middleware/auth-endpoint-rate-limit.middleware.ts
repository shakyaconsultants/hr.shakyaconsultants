import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RateLimitError } from '@shared/errors/app.error.js';

export interface AuthEndpointRateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function createAuthEndpointRateLimitMiddleware(options: AuthEndpointRateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator ?? ((req) => ipKeyGenerator(req.ip ?? '')),
    handler: (_req, _res, next) => {
      next(new RateLimitError(options.message ?? 'Too many requests, please try again later'));
    },
  });
}

export const forgotPasswordRateLimitMiddleware = createAuthEndpointRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests, please try again later',
});

export const resetPasswordRateLimitMiddleware = createAuthEndpointRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password reset attempts, please try again later',
});

export const refreshRateLimitMiddleware = createAuthEndpointRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: 'Too many token refresh attempts, please try again later',
});
