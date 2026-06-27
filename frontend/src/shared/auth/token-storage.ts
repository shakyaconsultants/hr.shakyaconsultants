import { APP_CONFIG, STORAGE_KEYS } from '@/config/app.config';

/** In-memory marker when auth is cookie-based (no Bearer token in JS). */
export const COOKIE_AUTH_SENTINEL = '__http_only_cookie__';

const COOKIE_SESSION_KEY = 'hr_shakya_cookie_session';
/** Persists across browser restart — indicates HttpOnly cookies may exist. */
const PERSISTENT_SESSION_HINT_KEY = 'hr_shakya_session_hint';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export function usesHttpOnlyCookies(): boolean {
  return APP_CONFIG.authUseHttpOnlyCookies;
}

export function getAccessToken(): string | null {
  if (usesHttpOnlyCookies()) {
    return memoryAccessToken;
  }
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (usesHttpOnlyCookies()) {
    return memoryRefreshToken;
  }
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/** Mark that a session was established — survives refresh/restart for restore hints. */
export function markSessionHint(): void {
  sessionStorage.setItem(COOKIE_SESSION_KEY, '1');
  localStorage.setItem(PERSISTENT_SESSION_HINT_KEY, '1');
}

export function clearSessionHint(): void {
  sessionStorage.removeItem(COOKIE_SESSION_KEY);
  localStorage.removeItem(PERSISTENT_SESSION_HINT_KEY);
}

export function hasSessionHint(): boolean {
  return (
    sessionStorage.getItem(COOKIE_SESSION_KEY) === '1' ||
    localStorage.getItem(PERSISTENT_SESSION_HINT_KEY) === '1'
  );
}

export function markCookieSessionActive(): void {
  if (usesHttpOnlyCookies()) {
    memoryAccessToken = COOKIE_AUTH_SENTINEL;
    memoryRefreshToken = COOKIE_AUTH_SENTINEL;
  }
  markSessionHint();
}

export function setStoredTokens(accessToken: string, refreshToken: string): void {
  if (usesHttpOnlyCookies()) {
    markCookieSessionActive();
    return;
  }

  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
  if (accessToken || refreshToken) {
    markSessionHint();
  }
}

export function clearStoredTokens(): void {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  clearSessionHint();
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function hasStoredAuth(): boolean {
  if (usesHttpOnlyCookies()) {
    return memoryAccessToken === COOKIE_AUTH_SENTINEL || hasSessionHint();
  }
  return Boolean(getAccessToken() || getRefreshToken());
}

/** Whether bootstrap should attempt GET /auth/me. */
export function shouldAttemptSessionRestore(): boolean {
  if (usesHttpOnlyCookies()) {
    return true;
  }
  return hasStoredAuth() || hasSessionHint();
}

export function isCookieAuthSession(): boolean {
  return usesHttpOnlyCookies() && getAccessToken() === COOKIE_AUTH_SENTINEL;
}

export function resolveBearerToken(): string | null {
  const token = getAccessToken();
  if (!token || token === COOKIE_AUTH_SENTINEL) {
    return null;
  }
  return token;
}
