import type { Request, Response, NextFunction } from 'express';
import { logger } from '@logging/winston.logger.js';
import { sanitizeUrlForLog } from '@shared/utils/sensitive-redact.util.js';

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.info('HTTP request', {
      method: req.method,
      path: sanitizeUrlForLog(req.originalUrl),
      statusCode: res.statusCode,
      durationMs,
      requestId: req.requestId,
      correlationId: req.correlationId,
      ip: req.ip,
    });
  });

  next();
}
