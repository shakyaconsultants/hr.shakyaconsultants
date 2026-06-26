import { APP_CONFIG, STORAGE_KEYS } from '@/config/app.config';

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

export function setStoredTokens(accessToken: string, refreshToken: string): void {
  if (usesHttpOnlyCookies()) {
    memoryAccessToken = accessToken || null;
    memoryRefreshToken = refreshToken || null;
    return;
  }

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
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
