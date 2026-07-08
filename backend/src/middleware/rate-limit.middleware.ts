import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { getEnv } from '@config/env.js';
import { RateLimitError } from '@shared/errors/app.error.js';

const passthrough: RequestHandler = (_req, _res, next) => {
  next();
};

export function createRateLimitMiddleware(): RequestHandler {
  const env = getEnv();

  // Local dev SPA traffic (wizard autosave, react-query refetch) exceeds production-style caps.
  if (env.NODE_ENV === 'development') {
    return passthrough;
  }

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
