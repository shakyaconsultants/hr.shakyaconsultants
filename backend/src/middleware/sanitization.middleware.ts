import type { Request, Response, NextFunction } from 'express';

const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_REGEX = /javascript:/gi;

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(HTML_TAG_REGEX, '').replace(SCRIPT_REGEX, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
}

export function sanitizationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.body !== null && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}
