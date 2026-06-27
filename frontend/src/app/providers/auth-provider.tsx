import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginRequest, logoutRequest, fetchMe } from '@/features/auth/api/auth.api';
import { prefetchAuthenticatedResources, restoreSession } from '@/shared/auth/auth-session';
import { getRefreshToken, markCookieSessionActive, setStoredTokens, usesHttpOnlyCookies } from '@/shared/auth/token-storage';
import { useAuthStore } from '@/shared/stores/app.store';

interface AuthContextValue {
  login: (payload: { companyCode: string; email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setAuthStatus = useAuthStore((s) => s.setAuthStatus);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      setAuthStatus('loading');

      const me = await restoreSession();
      if (cancelled) return;

      if (!me) {
        clearAuth();
        return;
      }

      setSession({
        user: me.user,
        company: me.company,
        permissions: me.permissions,
        roles: me.roles,
        sessionId: me.sessionId,
      });

      void prefetchAuthenticatedResources(queryClient);
      if (cancelled) return;

      setAuthStatus('authenticated');
    }

    void bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, [clearAuth, queryClient, setAuthStatus, setSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      login: async (payload) => {
        setAuthStatus('loading');
        const result = await loginRequest(payload);
        setStoredTokens(result.tokens.accessToken, result.tokens.refreshToken);
        if (usesHttpOnlyCookies()) {
          markCookieSessionActive();
        }

        const [me] = await Promise.all([
          fetchMe(),
          prefetchAuthenticatedResources(queryClient),
        ]);
        setSession({
          user: me.user,
          company: me.company,
          permissions: me.permissions,
          roles: me.roles,
          sessionId: me.sessionId,
        });

        setAuthStatus('authenticated');
      },
      logout: async () => {
        const refreshToken = getRefreshToken() ?? undefined;
        try {
          await logoutRequest(usesHttpOnlyCookies() ? undefined : refreshToken);
        } finally {
          queryClient.clear();
          clearAuth();
        }
      },
    }),
    [clearAuth, queryClient, setAuthStatus, setSession],
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
