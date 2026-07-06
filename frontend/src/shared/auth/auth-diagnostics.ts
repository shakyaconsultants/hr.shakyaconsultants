import { usesHttpOnlyCookies, hasStoredAuth, hasSessionHint } from '@/shared/auth/token-storage';

const ENABLED = import.meta.env.VITE_AUTH_DEBUG === 'true';

export type AuthDiagEvent =
  | 'bootstrap_started'
  | 'session_restore_started'
  | 'session_restore_skipped'
  | 'fetch_me_attempt'
  | 'fetch_me_response'
  | 'fetch_me_failed'
  | 'refresh_attempt'
  | 'refresh_result'
  | 'session_restored'
  | 'session_cleared'
  | 'redirect_to_login'
  | 'bootstrap_transient_error'
  | 'bootstrap_retry'
  | 'login_started'
  | 'login_success'
  | 'login_failed';

interface AuthDiagPayload {
  [key: string]: string | number | boolean | undefined | null;
}

export const authDiag = {
  log(event: AuthDiagEvent, payload: AuthDiagPayload = {}): void {
    if (!ENABLED) return;
    console.info(`[auth-diag] ${event}`, {
      ...payload,
      cookieMode: usesHttpOnlyCookies(),
      hasStoredAuth: hasStoredAuth(),
      hasSessionHint: hasSessionHint(),
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  },
};
