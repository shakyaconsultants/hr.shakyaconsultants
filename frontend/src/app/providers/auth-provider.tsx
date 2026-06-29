import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginRequest, logoutRequest, fetchMe } from '@/features/auth/api/auth.api';
import { applyLoginSession, runAuthBootstrap } from '@/shared/auth/auth-bootstrap';
import { authDiag } from '@/shared/auth/auth-diagnostics';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';
import { getRefreshToken, setStoredTokens, usesHttpOnlyCookies } from '@/shared/auth/token-storage';
import { useAuthStore } from '@/shared/stores/app.store';
import { BootstrapSplash } from '@/app/components/bootstrap-splash';

interface AuthContextValue {
  login: (payload: { companyCode: string; email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const authStatus = useAuthStore((s) => s.authStatus);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);

  const runBootstrap = useCallback(async () => {
    if (useAuthStore.getState().authStatus === AUTH_STATUS.AUTHENTICATED) {
      return;
    }
    setAuthStatus(AUTH_STATUS.LOADING);
    setBootstrapError(null);

    const result = await runAuthBootstrap();

    if (result.success) {
      setAuthStatus(AUTH_STATUS.AUTHENTICATED);
      return;
    }

    if (result.reason === 'transient' || result.reason === 'forbidden') {
      setBootstrapError(result.message ?? 'Unable to restore session. Please retry.');
      return;
    }

    authDiag.log('session_cleared', { reason: result.reason ?? 'unknown', status: result.status });
    clearAuth();
  }, [clearAuth, setAuthStatus]);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    void runBootstrap();
  }, [runBootstrap]);

  const value = useMemo<AuthContextValue>(
    () => ({
      login: async (payload) => {
        setAuthStatus(AUTH_STATUS.LOADING);
        setBootstrapError(null);
        try {
          const result = await loginRequest(payload);
          setStoredTokens(result.tokens.accessToken, result.tokens.refreshToken);

          const me = await fetchMe();
          applyLoginSession(me);
          setAuthStatus(AUTH_STATUS.AUTHENTICATED);
        } catch (error) {
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

  if (authStatus === AUTH_STATUS.LOADING) {
    return <BootstrapSplash error={bootstrapError} onRetry={() => void runBootstrap()} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
