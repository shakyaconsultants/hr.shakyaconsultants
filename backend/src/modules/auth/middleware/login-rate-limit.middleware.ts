import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { getEnv } from '@config/env.js';
import { RateLimitError } from '@shared/errors/app.error.js';

function resolveLoginRateLimitKey(req: Request): string {
  const ip = ipKeyGenerator(req.ip ?? '');
  const body = req.body as { email?: unknown } | undefined;
  const email = typeof body?.email === 'string' ? body.email.toLowerCase() : 'unknown';
  return `${ip}:${email}`;
}

export function createLoginRateLimitMiddleware() {
  const env = getEnv();
  return rateLimit({
    windowMs: env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_LOGIN_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: resolveLoginRateLimitKey,
    handler: (_req, _res, next) => {
      next(new RateLimitError('Too many login attempts, please try again later'));
    },
  });
}
