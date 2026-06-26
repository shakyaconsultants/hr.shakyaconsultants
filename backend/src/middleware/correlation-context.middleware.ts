import type { Request, Response, NextFunction } from 'express';
import { runWithRequestContext } from '@shared/context/request.context.js';

export function correlationContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  runWithRequestContext(
    {
      correlationId: req.correlationId,
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
    () => {
      next();
    },
  );
}
