import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginRequest, logoutRequest, fetchMe } from '@/features/auth/api/auth.api';
import {
  applySessionFromMe,
  clearStaleAuthBeforeLogin,
  restoreSession,
} from '@/shared/auth/auth-session';
import { authDiag } from '@/shared/auth/auth-diagnostics';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';
import { getRefreshToken, setStoredTokens, usesHttpOnlyCookies } from '@/shared/auth/token-storage';
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
  const restoreStartedRef = useRef(false);

  useEffect(() => {
    if (restoreStartedRef.current) {
      return;
    }
    if (useAuthStore.getState().authStatus !== AUTH_STATUS.RESTORING) {
      return;
    }

    restoreStartedRef.current = true;
    let cancelled = false;

    void (async () => {
      const outcome = await restoreSession();
      if (cancelled) {
        return;
      }

      if (outcome.ok) {
        applySessionFromMe(outcome.me);
        setAuthStatus(AUTH_STATUS.AUTHENTICATED);
        return;
      }

      authDiag.log('session_cleared', {
        reason: outcome.reason ?? 'unknown',
        status: outcome.status,
      });
      clearAuth();
      setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
    })();

    return () => {
      cancelled = true;
    };
  }, [clearAuth, setAuthStatus]);

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
