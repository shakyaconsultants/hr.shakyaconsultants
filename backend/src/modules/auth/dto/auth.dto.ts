import type { BootstrapInput } from '@modules/auth/validators/bootstrap.validator.js';

export interface AuthUserResponse {
  id: string;
  email: string;
  employeeId?: string;
  status: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
}

export interface LoginResponse {
  user: AuthUserResponse;
  tokens: AuthTokenResponse;
  sessionId: string;
}

export interface RefreshResponse {
  tokens: AuthTokenResponse;
  sessionId: string;
}

export interface SessionNavigationItem {
  id: string;
  enabled: boolean;
  order: number;
  label?: string;
  icon?: string;
  portals?: string[];
  path?: string;
}

export interface CurrentUserResponse {
  user: AuthUserResponse;
  company: {
    id: string;
    name: string;
    code: string;
    email: string;
    timezone: string;
    currency: string;
  };
  roles: Array<{ id: string; name: string; slug: string }>;
  permissions: string[];
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    departmentId: string;
    designationId: string;
    branchId?: string;
    reportingManagerId?: string;
    employmentType: string;
    status: string;
    joinedAt: string;
  };
  portal: 'enterprise' | 'manager' | 'workspace';
  homeRoute: string;
  navigation: { items: SessionNavigationItem[] };
  featureFlags: Record<string, boolean>;
  sessionId: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface SystemStatusResponse {
  initialized: boolean;
}

export interface BootstrapResultResponse {
  companyId: string;
  companyCode: string;
  branchId: string;
  adminUserId: string;
  adminEmployeeId: string;
  superAdminRoleId: string;
  message: string;
}

export function toAuthUserResponse(user: {
  id: string;
  email: string;
  employeeId?: string;
  status: string;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
}): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    employeeId: user.employeeId,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}

export function toLoginResponse(params: {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  sessionId: string;
}): LoginResponse {
  return {
    user: params.user,
    tokens: {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      expiresIn: params.expiresIn,
      tokenType: 'Bearer',
    },
    sessionId: params.sessionId,
  };
}

export function toBootstrapResponse(result: BootstrapResultResponse): BootstrapResultResponse {
  return result;
}

export type { BootstrapInput };
