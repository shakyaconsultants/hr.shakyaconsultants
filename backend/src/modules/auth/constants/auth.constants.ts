export const AUTH_COOKIE_NAMES = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;

export const AUTH_TOKEN_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type AuthTokenType = (typeof AUTH_TOKEN_TYPE)[keyof typeof AUTH_TOKEN_TYPE];

export const AUTH_ROUTES = {
  BASE: '/auth',
  LOGIN: '/login',
  REFRESH: '/refresh',
  LOGOUT: '/logout',
  LOGOUT_ALL: '/logout-all',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ME: '/me',
  SESSIONS: '/sessions',
  SESSIONS_HISTORY: '/sessions/history',
  SESSION_REVOKE: '/sessions/:sessionId/revoke',
  BOOTSTRAP: '/bootstrap',
  SYSTEM_STATUS: '/system/status',
} as const;

export const AUTH_BOOTSTRAP_ROUTES = [
  AUTH_ROUTES.BOOTSTRAP,
  AUTH_ROUTES.SYSTEM_STATUS,
] as const;

export const AUTH_ENTITY_TYPES = {
  USER: 'user',
  SESSION: 'device_session',
} as const;

export const AUTH_AUDIT_WHERE = {
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_LOGOUT_ALL: 'auth.logout_all',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_BOOTSTRAP: 'auth.bootstrap',
  AUTH_ACCOUNT_ACTIVATION: 'auth.account_activation',
  AUTH_ACCOUNT_ACTIVATION_ISSUE: 'auth.account_activation_issue',
  AUTH_SESSION_REVOKE: 'auth.session_revoke',
} as const;

export const AUTH_PUBLIC_ROUTES = [
  AUTH_ROUTES.LOGIN,
  AUTH_ROUTES.REFRESH,
  AUTH_ROUTES.FORGOT_PASSWORD,
  AUTH_ROUTES.RESET_PASSWORD,
  AUTH_ROUTES.SYSTEM_STATUS,
] as const;

export const PORTAL_ROUTES = {
  BASE: '/portal',
  ONBOARDING: '/onboarding/:token',
  ONBOARDING_DRAFT: '/onboarding/:token/draft',
  ONBOARDING_SUBMIT: '/onboarding/:token/submit',
  ACTIVATION: '/account-activation/:token',
  ACTIVATION_STATUS: '/account-activation/:token/status',
  ACTIVATION_COMPLETE: '/account-activation/:token/activate',
} as const;

export const AUTH_EMAIL_JOBS = {
  PASSWORD_RESET: 'email.sendPasswordReset',
  ACCOUNT_ACTIVATION: 'email.sendAccountActivation',
  ONBOARDING_PORTAL: 'email.sendOnboardingPortal',
} as const;

export const PASSWORD_RESET_TOKEN_BYTES = 32;

export const PASSWORD_RESET_EXPIRY_MS = 3600000;

export const AUTH_CACHE_KEY_PREFIX = {
  PERMISSIONS: 'auth:permissions',
  REFRESH_REPLAY: 'auth:refresh-replay',
} as const;

export function buildPermissionCacheKey(prefix: string, companyId: string, userId: string): string {
  return `${prefix}:${companyId}:${AUTH_CACHE_KEY_PREFIX.PERMISSIONS}:${userId}`;
}

export function buildRefreshReplayKey(prefix: string, jti: string): string {
  return `${prefix}:${AUTH_CACHE_KEY_PREFIX.REFRESH_REPLAY}:${jti}`;
}
