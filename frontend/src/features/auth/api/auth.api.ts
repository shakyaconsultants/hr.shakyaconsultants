import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type { FeatureFlags } from '@/config/module-registry';
import type { AuthCompany, AuthEmployeeProfile, AuthRole, AuthUser, SessionNavigationItem } from '@/shared/stores/app.store';

const AUTH_PREFIX = '/api/v1/auth';

export interface LoginPayload {
  companyCode: string;
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number; tokenType: string };
  sessionId: string;
}

export interface MeResult {
  user: AuthUser;
  company: AuthCompany;
  employee?: AuthEmployeeProfile | null;
  permissions: string[];
  roles: AuthRole[];
  portal: string;
  homeRoute: string;
  navigation: { items: SessionNavigationItem[] };
  featureFlags: FeatureFlags;
  sessionId: string;
}

async function unwrap<T>(response: { data: ApiSuccessResponse<T> }): Promise<T> {
  return response.data.data;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const response = await apiClient.post<ApiSuccessResponse<LoginResult>>(`${AUTH_PREFIX}/login`, payload);
  return unwrap(response);
}

export async function fetchMe(): Promise<MeResult> {
  const response = await apiClient.get<ApiSuccessResponse<MeResult>>(`${AUTH_PREFIX}/me`);
  return unwrap(response);
}

export async function refreshTokens(refreshToken?: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> {
  const response = await apiClient.post<ApiSuccessResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
    `${AUTH_PREFIX}/refresh`,
    refreshToken ? { refreshToken } : {},
  );
  return unwrap(response);
}

export async function logoutRequest(refreshToken?: string): Promise<void> {
  await apiClient.post(`${AUTH_PREFIX}/logout`, { refreshToken });
}

export async function forgotPasswordRequest(companyCode: string, email: string): Promise<{ message: string }> {
  const response = await apiClient.post<ApiSuccessResponse<{ message: string }>>(`${AUTH_PREFIX}/forgot-password`, {
    companyCode,
    email,
  });
  return unwrap(response);
}

export async function resetPasswordRequest(token: string, password: string): Promise<{ message: string }> {
  const response = await apiClient.post<ApiSuccessResponse<{ message: string }>>(`${AUTH_PREFIX}/reset-password`, {
    token,
    password,
  });
  return unwrap(response);
}

export async function fetchSystemStatus(): Promise<{ initialized: boolean }> {
  const response = await apiClient.get<ApiSuccessResponse<{ initialized: boolean }>>(`${AUTH_PREFIX}/system/status`);
  return unwrap(response);
}

export async function fetchActivationStatus(token: string): Promise<{ valid: boolean; expired: boolean; email?: string }> {
  const response = await apiClient.get<ApiSuccessResponse<{ valid: boolean; expired: boolean; email?: string }>>(
    `/api/v1/portal/account-activation/${token}/status`,
  );
  return unwrap(response);
}

export async function activateAccountRequest(token: string, password: string): Promise<{ message: string }> {
  const response = await apiClient.post<ApiSuccessResponse<{ message: string }>>(
    `/api/v1/portal/account-activation/${token}/activate`,
    { password },
  );
  return unwrap(response);
}

export async function fetchOnboardingPortal(token: string) {
  const response = await apiClient.get<ApiSuccessResponse<Record<string, unknown>>>(`/api/v1/portal/onboarding/${token}`);
  return unwrap(response);
}

export async function saveOnboardingDraft(token: string, section: string, data: Record<string, unknown>) {
  const response = await apiClient.put<ApiSuccessResponse<Record<string, unknown>>>(`/api/v1/portal/onboarding/${token}/draft`, {
    section,
    data,
  });
  return unwrap(response);
}

export async function submitOnboardingPortal(token: string) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(`/api/v1/portal/onboarding/${token}/submit`);
  return unwrap(response);
}
