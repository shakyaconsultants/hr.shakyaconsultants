import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { runWithRequestContext } from '@shared/context/request.context.js';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    runWithRequestContext(
      {
        correlationId: req.correlationId,
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
      () => {
        Promise.resolve(fn(req, res, next)).catch(next);
      },
    );
  };
}
