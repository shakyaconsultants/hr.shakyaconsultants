import type { Request, Response, NextFunction } from 'express';

export function responseTimeMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    res.locals.responseTimeMs = durationMs;
  });

  next();
}
