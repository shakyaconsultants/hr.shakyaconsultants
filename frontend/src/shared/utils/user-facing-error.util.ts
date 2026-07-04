const INTERNAL_ERROR_PATTERNS = [
  /econnrefused/i,
  /enetunreach/i,
  /enotfound/i,
  /etimedout/i,
  /ehostunreach/i,
  /mongodb/i,
  /mongoose/i,
  /redis/i,
  /smtp/i,
  /cloudinary/i,
  /socket hang up/i,
  /getaddrinfo/i,
  /\bconnect\s+[A-Z_]+/i,
  /\b\d{1,3}(?:\.\d{1,3}){3}\b/,
  /[a-f0-9:]{8,}:\d{2,5}/i,
  /at\s+\S+\.(?:ts|js):\d+/i,
  /\/(?:src|node_modules)\//i,
];

function isEmailRelated(message: string): boolean {
  return /smtp|email|mail|activation|onboarding|password reset|587|465/i.test(message);
}

/** Map stored or caught errors to safe UI copy — never show IPs, ports, or stack traces. */
export function toUserFacingErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const raw =
    typeof error === 'string'
      ? error.trim()
      : error instanceof Error
        ? error.message.trim()
        : '';

  if (!raw) {
    return fallback;
  }

  if (raw.startsWith('Email could not be delivered') || raw.startsWith('Email could not be sent')) {
    return 'Email could not be sent. Ask your administrator to verify SMTP settings.';
  }

  for (const pattern of INTERNAL_ERROR_PATTERNS) {
    if (pattern.test(raw)) {
      if (isEmailRelated(raw)) {
        return 'Email could not be sent. The mail server is unreachable. Try again later or contact your administrator.';
      }
      return fallback;
    }
  }

  if (raw.length > 180) {
    return fallback;
  }

  return raw;
}
