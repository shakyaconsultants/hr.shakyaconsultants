import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG, ROUTES } from '@/config/app.config';
import type { ApiErrorResponse } from '@/shared/types/api.types';
import { refreshTokens } from '@/features/auth/api/auth.api';
import {
  clearStoredTokens,
  getAccessToken,
  getRefreshToken,
  setStoredTokens,
  usesHttpOnlyCookies,
} from '@/shared/auth/token-storage';

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!usesHttpOnlyCookies() && !refreshToken) {
    return null;
  }

  const result = await refreshTokens(refreshToken ?? undefined);
  const accessToken = result.tokens.accessToken;
  const nextRefreshToken = result.tokens.refreshToken;

  if (accessToken || nextRefreshToken) {
    setStoredTokens(accessToken, nextRefreshToken);
  }

  return accessToken || getAccessToken();
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original.url?.includes('/auth/login')) {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken && original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      clearStoredTokens();
      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.assign(ROUTES.LOGIN);
      }
    }

    if (error.response?.data?.success === false) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
