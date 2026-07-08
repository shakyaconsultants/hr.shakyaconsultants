import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG, ROUTES } from '@/config/app.config';
import type { ApiErrorResponse } from '@/shared/types/api.types';
import { authDiag } from '@/shared/auth/auth-diagnostics';
import {
  isSessionRestoreActive,
  refreshAccessTokenOnce,
  clearServerAuthCookies,
} from '@/shared/auth/auth-session';
import {
  clearStoredTokens,
  resolveBearerToken,
  usesHttpOnlyCookies,
} from '@/shared/auth/token-storage';
import { useAuthStore } from '@/shared/stores/app.store';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _authRetried?: boolean;
}

const AUTH_REFRESH_SKIP_PATHS = [
  '/auth/login',
  '/auth/logout',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
];

function shouldSkipAuthRefresh(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_REFRESH_SKIP_PATHS.some((path) => url.includes(path));
}

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = resolveBearerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._authRetried &&
      !shouldSkipAuthRefresh(original.url)
    ) {
      original._authRetried = true;

      const refreshed = await refreshAccessTokenOnce();
      if (refreshed === 'success') {
        const token = resolveBearerToken();
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
        } else if (usesHttpOnlyCookies()) {
          delete original.headers.Authorization;
        }
        return apiClient(original);
      }

      // Only logout when the server confirms the session is dead — not when the API is briefly down (tsx watch restart).
      if (refreshed === 'invalid' && !isSessionRestoreActive()) {
        clearStoredTokens();
        authDiag.log('session_cleared', { reason: '401_after_refresh_failed', url: original.url });
        useAuthStore.getState().clearAuth();
        void clearServerAuthCookies();

        if (window.location.pathname !== ROUTES.LOGIN) {
          authDiag.log('redirect_to_login', {
            reason: '401_confirmed',
            from: window.location.pathname,
          });
          window.location.assign(ROUTES.LOGIN);
        }
      }
    }

    if (error.response?.data?.success === false) {
      const rejectedData = {
        ...error.response.data,
        status: error.response.status,
      };
      return Promise.reject(rejectedData);
    }

    if (!error.response && error.config && !shouldSkipAuthRefresh(error.config.url)) {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (offline && window.location.pathname !== ROUTES.NETWORK_ERROR) {
        window.location.assign(ROUTES.NETWORK_ERROR);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
