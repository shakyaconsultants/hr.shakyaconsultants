import { fetchMe, refreshTokens } from '@/features/auth/api/auth.api';
import { authDiag } from '@/shared/auth/auth-diagnostics';
import { classifyHttpFailure } from '@/shared/auth/auth-error.util';
import type { SessionRestoreOutcome } from '@/shared/auth/session-restore.types';
import {
  getRefreshToken,
  markCookieSessionActive,
  setStoredTokens,
  shouldAttemptSessionRestore,
  usesHttpOnlyCookies,
} from '@/shared/auth/token-storage';

let bootstrapActive = false;
let sessionRestorePromise: Promise<SessionRestoreOutcome> | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function isAuthBootstrapActive(): boolean {
  return bootstrapActive;
}

export function refreshAccessTokenOnce(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!usesHttpOnlyCookies() && !refreshToken) {
      authDiag.log('refresh_result', { success: false, reason: 'no_refresh_token' });
      return false;
    }

    authDiag.log('refresh_attempt', { cookieMode: usesHttpOnlyCookies() });

    try {
      const result = await refreshTokens(refreshToken ?? undefined);
      setStoredTokens(result.tokens.accessToken, result.tokens.refreshToken);
      if (usesHttpOnlyCookies()) {
        markCookieSessionActive();
      }
      authDiag.log('refresh_result', { success: true });
      return true;
    } catch (error) {
      const failure = classifyHttpFailure(error);
      authDiag.log('refresh_result', {
        success: false,
        reason: failure.reason,
        status: failure.status,
      });
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function restoreSession(): Promise<SessionRestoreOutcome> {
  if (sessionRestorePromise) {
    return sessionRestorePromise;
  }

  sessionRestorePromise = performSessionRestore().finally(() => {
    sessionRestorePromise = null;
  });

  return sessionRestorePromise;
}

async function performSessionRestore(): Promise<SessionRestoreOutcome> {
  if (!shouldAttemptSessionRestore()) {
    authDiag.log('session_restore_skipped', { reason: 'no_session_hint' });
    return { ok: false, reason: 'no_session_hint' };
  }

  authDiag.log('session_restore_started');
  bootstrapActive = true;

  try {
    authDiag.log('fetch_me_attempt', { attempt: 1, maxAttempts: 1 });
    const me = await fetchMe();
    authDiag.log('fetch_me_response', { status: 200, userId: me.user.id });
    authDiag.log('session_restored', { userId: me.user.id, sessionId: me.sessionId });
    return { ok: true, me };
  } catch (error) {
    const failure = classifyHttpFailure(error);
    authDiag.log('fetch_me_failed', {
      attempt: 1,
      reason: failure.reason,
      status: failure.status,
      message: failure.message,
      retryable: failure.retryable,
    });

    return {
      ok: false,
      reason: failure.reason,
      status: failure.status,
      message: failure.message,
    };
  } finally {
    bootstrapActive = false;
  }
}
