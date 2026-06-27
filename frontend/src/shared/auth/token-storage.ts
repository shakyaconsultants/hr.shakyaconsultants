import { APP_CONFIG, STORAGE_KEYS } from '@/config/app.config';

/** In-memory marker when auth is cookie-based (no Bearer token in JS). */
export const COOKIE_AUTH_SENTINEL = '__http_only_cookie__';

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

export function markCookieSessionActive(): void {
  if (usesHttpOnlyCookies()) {
    memoryAccessToken = COOKIE_AUTH_SENTINEL;
    memoryRefreshToken = COOKIE_AUTH_SENTINEL;
  }
}

export function setStoredTokens(accessToken: string, refreshToken: string): void {
  if (usesHttpOnlyCookies()) {
    if (accessToken || refreshToken) {
      markCookieSessionActive();
    }
    return;
  }

  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

export function clearStoredTokens(): void {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function hasStoredAuth(): boolean {
  if (usesHttpOnlyCookies()) {
    return true;
  }
  return Boolean(getAccessToken() || getRefreshToken());
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
