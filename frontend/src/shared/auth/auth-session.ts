import { fetchMe, logoutRequest, refreshTokens } from '@/features/auth/api/auth.api';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/config/module-registry';
import type { PortalType } from '@/config/portals';
import { authDiag } from '@/shared/auth/auth-diagnostics';
import { classifyHttpFailure, classifySessionRestoreFailure } from '@/shared/auth/auth-error.util';
import type { SessionRestoreOutcome } from '@/shared/auth/session-restore.types';
import {
  clearOrphanSessionHint,
  clearStoredTokens,
  getAccessToken,
  getRefreshToken,
  markCookieSessionActive,
  markSessionHint,
  setStoredTokens,
  shouldAttemptSessionRestore,
  usesHttpOnlyCookies,
} from '@/shared/auth/token-storage';
import { useAuthStore } from '@/shared/stores/app.store';

let sessionRestoreActive = false;
let sessionRestorePromise: Promise<SessionRestoreOutcome> | null = null;
let refreshInFlight: Promise<RefreshAccessTokenResult> | null = null;

const SERVER_COOKIE_CLEAR_TIMEOUT_MS = 3_000;

export function isSessionRestoreActive(): boolean {
  return sessionRestoreActive;
}

/** @deprecated Use isSessionRestoreActive */
export function isAuthBootstrapActive(): boolean {
  return isSessionRestoreActive();
}

export function applySessionFromMe(me: Awaited<ReturnType<typeof fetchMe>>): void {
  useAuthStore.getState().setSession({
    user: me.user,
    company: me.company,
    employee: me.employee ?? null,
    permissions: me.permissions,
    roles: me.roles,
    portal: me.portal as PortalType,
    homeRoute: me.homeRoute,
    navigation: me.navigation.items,
    featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...me.featureFlags } as FeatureFlags,
    sessionId: me.sessionId,
  });
  markSessionHint();
}

/** Best-effort server-side HttpOnly cookie purge (fixes stale cookie login loops). */
export async function clearServerAuthCookies(): Promise<void> {
  try {
    await logoutRequest(undefined, { timeout: SERVER_COOKIE_CLEAR_TIMEOUT_MS });
  } catch {
    // Cookies may already be invalid — clearing client hints is still required.
  }
}

async function clearInvalidSession(): Promise<void> {
  clearStoredTokens();
  await clearServerAuthCookies();
}

export type RefreshAccessTokenResult = 'success' | 'invalid' | 'unavailable';

export function refreshAccessTokenOnce(): Promise<RefreshAccessTokenResult> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async (): Promise<RefreshAccessTokenResult> => {
    const refreshToken = getRefreshToken();
    if (!usesHttpOnlyCookies() && !refreshToken) {
      authDiag.log('refresh_result', { success: false, reason: 'no_refresh_token' });
      return 'invalid';
    }

    authDiag.log('refresh_attempt', { cookieMode: usesHttpOnlyCookies() });

    try {
      const result = await refreshTokens(refreshToken ?? undefined);
      setStoredTokens(result.tokens.accessToken, result.tokens.refreshToken);
      if (usesHttpOnlyCookies()) {
        markCookieSessionActive();
      }
      authDiag.log('refresh_result', { success: true });
      return 'success';
    } catch (error) {
      const failure = classifyHttpFailure(error);
      authDiag.log('refresh_result', {
        success: false,
        reason: failure.reason,
        status: failure.status,
      });
      if (failure.reason === 'unauthenticated' || failure.reason === 'forbidden') {
        await clearInvalidSession();
        return 'invalid';
      }
      return 'unavailable';
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

/** Clears client session markers before a fresh login. */
export async function clearStaleAuthBeforeLogin(): Promise<void> {
  clearOrphanSessionHint();
  clearStoredTokens();
  await clearServerAuthCookies();
}

async function performSessionRestore(): Promise<SessionRestoreOutcome> {
  clearOrphanSessionHint();

  if (!shouldAttemptSessionRestore()) {
    authDiag.log('session_restore_skipped', { reason: 'no_tokens' });
    return { ok: false, reason: 'no_session_hint' };
  }

  authDiag.log('session_restore_started');
  sessionRestoreActive = true;

  try {
    const needsProactiveRefresh =
      usesHttpOnlyCookies() || (!getAccessToken() && Boolean(getRefreshToken()));

    if (needsProactiveRefresh) {
      const refreshed = await refreshAccessTokenOnce();
      if (refreshed === 'invalid' && !usesHttpOnlyCookies() && !getAccessToken()) {
        await clearInvalidSession();
        return { ok: false, reason: 'unauthenticated', message: 'Session expired or invalid' };
      }
    }

    try {
      authDiag.log('fetch_me_attempt', { attempt: 1, maxAttempts: 1 });
      const me = await fetchMe();
      authDiag.log('session_restored', { userId: me.user.id, sessionId: me.sessionId });
      return { ok: true, me };
    } catch (error) {
      const failure = classifySessionRestoreFailure(error);
      authDiag.log('fetch_me_failed', {
        reason: failure.reason,
        status: failure.status,
        message: failure.message,
      });

      const canRefresh = usesHttpOnlyCookies() || Boolean(getRefreshToken());
      if (failure.reason === 'unauthenticated' && canRefresh) {
        const refreshed = await refreshAccessTokenOnce();
        if (refreshed === 'success') {
          try {
            const me = await fetchMe();
            authDiag.log('session_restored', { userId: me.user.id, sessionId: me.sessionId });
            return { ok: true, me };
          } catch (retryError) {
            const retryFailure = classifySessionRestoreFailure(retryError);
            if (retryFailure.reason === 'unauthenticated' || retryFailure.reason === 'forbidden') {
              await clearInvalidSession();
            }
            return {
              ok: false,
              reason: retryFailure.reason,
              status: retryFailure.status,
              message: retryFailure.message,
            };
          }
        }
      }

      if (failure.reason === 'unauthenticated' || failure.reason === 'forbidden') {
        await clearInvalidSession();
      }

      return {
        ok: false,
        reason: failure.reason,
        status: failure.status,
        message: failure.message,
      };
    }
  } finally {
    sessionRestoreActive = false;
  }
}
