import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { HEADERS } from '@shared/constants/http.constants.js';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId =
    (req.headers[HEADERS.REQUEST_ID] as string | undefined) ?? uuidv4();

  const correlationId =
    (req.headers[HEADERS.CORRELATION_ID] as string | undefined) ?? requestId;

  req.requestId = requestId;
  req.correlationId = correlationId;

  res.setHeader(HEADERS.REQUEST_ID, requestId);
  res.setHeader(HEADERS.CORRELATION_ID, correlationId);

  next();
}
