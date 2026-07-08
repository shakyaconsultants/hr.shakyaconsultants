const ACCESS_EXPIRES_AT_KEY = 'hr_shakya_access_expires_at';

/** Matches backend parseExpiresInToMs — supports JWT-style strings or seconds. */
export function parseExpiresInToMs(expiresIn: string | number): number {
  if (typeof expiresIn === 'number' && Number.isFinite(expiresIn)) {
    // Backend may send seconds (jwt) or ms — values under 24h treated as seconds.
    return expiresIn < 86_400 ? expiresIn * 1000 : expiresIn;
  }

  const normalized = String(expiresIn).trim();
  const match = /^(\d+)([smhd])$/.exec(normalized);
  if (!match) {
    return 8 * 60 * 60 * 1000;
  }

  const value = Number.parseInt(match[1], 10);
  switch (match[2]) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 8 * 60 * 60 * 1000;
  }
}

export function rememberAccessTokenExpiry(expiresIn: string | number): void {
  const expiresAt = Date.now() + parseExpiresInToMs(expiresIn);
  sessionStorage.setItem(ACCESS_EXPIRES_AT_KEY, String(expiresAt));
}

export function clearAccessTokenExpiry(): void {
  sessionStorage.removeItem(ACCESS_EXPIRES_AT_KEY);
}

export function getAccessTokenExpiresAt(): number | null {
  const raw = sessionStorage.getItem(ACCESS_EXPIRES_AT_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function msUntilAccessTokenExpiry(): number | null {
  const expiresAt = getAccessTokenExpiresAt();
  if (expiresAt === null) {
    return null;
  }
  return expiresAt - Date.now();
}

/** Refresh ~2 minutes before expiry, or at 80% of TTL — whichever is sooner. */
export function msUntilProactiveRefresh(expiresIn: string | number): number {
  const ttlMs = parseExpiresInToMs(expiresIn);
  const leadMs = Math.min(2 * 60 * 1000, Math.max(60_000, ttlMs * 0.2));
  return Math.max(30_000, ttlMs - leadMs);
}

export function isAccessTokenNearExpiry(thresholdMs = 5 * 60 * 1000): boolean {
  const remaining = msUntilAccessTokenExpiry();
  if (remaining === null) {
    return false;
  }
  return remaining <= thresholdMs;
}
