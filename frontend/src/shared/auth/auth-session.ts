import { fetchMe, refreshTokens } from '@/features/auth/api/auth.api';
import { authDiag } from '@/shared/auth/auth-diagnostics';
import { classifyHttpFailure, isRetryableFailure } from '@/shared/auth/auth-error.util';
import type { SessionRestoreOutcome } from '@/shared/auth/session-restore.types';
import {
  getRefreshToken,
  markCookieSessionActive,
  setStoredTokens,
  shouldAttemptSessionRestore,
  usesHttpOnlyCookies,
} from '@/shared/auth/token-storage';

const RETRY_DELAYS_MS = [400, 900, 1800];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

let bootstrapActive = false;
let sessionRestorePromise: Promise<SessionRestoreOutcome> | null = null;
let refreshInFlight: Promise<boolean> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      authDiag.log('fetch_me_attempt', { attempt: attempt + 1, maxAttempts: MAX_ATTEMPTS });

      try {
        const me = await fetchMe();
        authDiag.log('fetch_me_response', { status: 200, userId: me.user.id });
        authDiag.log('session_restored', { userId: me.user.id, sessionId: me.sessionId });
        return { ok: true, me };
      } catch (error) {
        const failure = classifyHttpFailure(error);
        authDiag.log('fetch_me_failed', {
          attempt: attempt + 1,
          reason: failure.reason,
          status: failure.status,
          message: failure.message,
          retryable: failure.retryable,
        });

        if (!isRetryableFailure(failure.reason)) {
          return {
            ok: false,
            reason: failure.reason,
            status: failure.status,
            message: failure.message,
          };
        }

        if (attempt < MAX_ATTEMPTS - 1) {
          const delay = RETRY_DELAYS_MS[attempt] ?? 1000;
          authDiag.log('bootstrap_retry', { attempt: attempt + 1, delayMs: delay });
          await sleep(delay);
          continue;
        }

        return {
          ok: false,
          reason: 'transient',
          status: failure.status,
          message: failure.message,
        };
      }
    }

    return { ok: false, reason: 'transient', message: 'Session restore exhausted retries' };
  } finally {
    bootstrapActive = false;
  }
}
