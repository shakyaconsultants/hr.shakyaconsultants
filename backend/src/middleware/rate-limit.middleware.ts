import rateLimit from 'express-rate-limit';
import { getEnv } from '@config/env.js';
import { RateLimitError } from '@shared/errors/app.error.js';

export function createRateLimitMiddleware() {
  const env = getEnv();
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new RateLimitError('Too many requests, please try again later'));
    },
  });
}
