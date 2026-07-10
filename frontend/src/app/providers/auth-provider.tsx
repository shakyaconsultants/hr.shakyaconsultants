import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginRequest, logoutRequest, fetchMe } from '@/features/auth/api/auth.api';
import {
  applySessionFromMe,
  clearStaleAuthBeforeLogin,
  failSessionRestore,
  restoreSession,
} from '@/shared/auth/auth-session';
import {
  ensureProactiveRefreshScheduled,
  scheduleProactiveTokenRefresh,
  stopProactiveTokenRefresh,
} from '@/shared/auth/auth-token-refresh-scheduler';
import { authDiag } from '@/shared/auth/auth-diagnostics';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';
import {
  getRefreshToken,
  setStoredTokens,
  usesHttpOnlyCookies,
  clearStoredTokens,
} from '@/shared/auth/token-storage';
import { useAuthStore } from '@/shared/stores/app.store';

interface AuthContextValue {
  login: (payload: {
    companyCode: string;
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setAuthStatus = useAuthStore((s) => s.setAuthStatus);

  useEffect(() => {
    if (useAuthStore.getState().authStatus !== AUTH_STATUS.RESTORING) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const outcome = await restoreSession();
      if (cancelled) {
        return;
      }

      if (outcome.ok) {
        applySessionFromMe(outcome.me);
        setAuthStatus(AUTH_STATUS.AUTHENTICATED);
        ensureProactiveRefreshScheduled('8h');
        return;
      }

      if (outcome.reason === 'transient') {
        authDiag.log('bootstrap_transient_error', { reason: outcome.message });
        clearStoredTokens();
        setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
        return;
      }

      if (outcome.reason === 'no_session_hint') {
        setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
        return;
      }

      authDiag.log('session_cleared', {
        reason: outcome.reason ?? 'unknown',
        status: outcome.status,
      });
      await failSessionRestore();
      setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
    })();

    return () => {
      cancelled = true;
    };
  }, [setAuthStatus]);

  const value = useMemo<AuthContextValue>(
    () => ({
      login: async (payload) => {
        authDiag.log('login_started', { email: payload.email, companyCode: payload.companyCode });
        try {
          await clearStaleAuthBeforeLogin();
          const result = await loginRequest(payload);
          setStoredTokens(result.tokens.accessToken, result.tokens.refreshToken);

          const me = result.profile ?? (await fetchMe());
          applySessionFromMe(me);
          setAuthStatus(AUTH_STATUS.AUTHENTICATED);
          scheduleProactiveTokenRefresh(result.tokens.expiresIn ?? '8h');
          authDiag.log('login_success', { userId: me.user.id });
        } catch (error) {
          authDiag.log('login_failed', {
            message: error instanceof Error ? error.message : String(error),
          });
          setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
          throw error;
        }
      },
      logout: async () => {
        const refreshToken = getRefreshToken() ?? undefined;
        try {
          await logoutRequest(usesHttpOnlyCookies() ? undefined : refreshToken);
        } finally {
          queryClient.clear();
          authDiag.log('session_cleared', { reason: 'logout' });
          stopProactiveTokenRefresh();
          clearAuth();
        }
      },
    }),
    [clearAuth, queryClient, setAuthStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
