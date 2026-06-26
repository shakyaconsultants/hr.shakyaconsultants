const SENSITIVE_KEY_PATTERN =
  /password|secret|token|authorization|cookie|api[_-]?key|refresh|access|smtp|cloudinary|mongodb|redis|otp|csrf|session[_-]?id|credential|private[_-]?key/i;

const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;

const HIGH_ENTROPY_PATH_SEGMENTS = [
  '/onboarding/',
  '/account-activation/',
  '/reset-password/',
  '/portal/',
];

export function maskConnectionString(value: string): string {
  return value.replace(
    /((?:mongodb(?:\+srv)?|redis(?:s)?):\/\/)(?:[^@\s]+@)?([^\s/]+)(\/[^\s"']*)?/gi,
    (_match, protocol: string, host: string, path = '') => `${protocol}******@${host}${path}`,
  );
}

export function sanitizeUrlForLog(url: string): string {
  let sanitized = url.split('?')[0] ?? url;

  for (const segment of HIGH_ENTROPY_PATH_SEGMENTS) {
    const index = sanitized.indexOf(segment);
    if (index !== -1) {
      const prefix = sanitized.slice(0, index + segment.length);
      sanitized = `${prefix}[REDACTED]`;
      break;
    }
  }

  if (sanitized.includes('/reset-password/')) {
    sanitized = sanitized.replace(/\/reset-password\/[^/?#]+/, '/reset-password/[REDACTED]');
  }

  return sanitized;
}

function redactString(value: string): string {
  let result = value.replace(BEARER_PATTERN, 'Bearer [REDACTED]');
  result = maskConnectionString(result);
  if (result.length > 8 && /^[A-Za-z0-9+/=_-]{32,}$/.test(result)) {
    return '[REDACTED]';
  }
  return result;
}

function redactValue(key: string, value: unknown, depth: number): unknown {
  if (depth > 8) {
    return '[REDACTED]';
  }

  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(String(index), item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    return redactObject(value as Record<string, unknown>, depth + 1);
  }

  return value;
}

export function redactObject(value: Record<string, unknown>, depth = 0): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = redactValue(key, entry, depth);
  }
  return result;
}

export function redactUnknown(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return redactString(value);
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactUnknown(item));
  }
  if (typeof value === 'object') {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}
