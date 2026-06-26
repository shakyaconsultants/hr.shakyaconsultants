import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG, ROUTES, STORAGE_KEYS } from '@/config/app.config';
import type { ApiErrorResponse } from '@/shared/types/api.types';
import { refreshTokens } from '@/features/auth/api/auth.api';

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
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) {
    return null;
  }
  const result = await refreshTokens(refreshToken);
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.tokens.refreshToken);
  return result.tokens.accessToken;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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

      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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
