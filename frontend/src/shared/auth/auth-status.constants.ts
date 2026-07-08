/** Auth states — app renders immediately; RESTORING only blocks protected routes. */
export const AUTH_STATUS = {
  RESTORING: 'restoring',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
} as const;

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];
