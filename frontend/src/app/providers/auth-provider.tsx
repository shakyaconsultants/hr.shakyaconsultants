import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe, loginRequest, logoutRequest, refreshTokens } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/shared/stores/app.store';
import { getRefreshToken, hasStoredAuth, usesHttpOnlyCookies } from '@/shared/auth/token-storage';

interface AuthContextValue {
  login: (payload: { companyCode: string; email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setSession = useAuthStore((s) => s.setSession);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      setLoading(true);

      if (!usesHttpOnlyCookies() && !hasStoredAuth()) {
        if (!cancelled) {
          clearAuth();
          setInitialized(true);
        }
        return;
      }

      try {
        const me = await fetchMe();
        if (!cancelled) {
          setSession({
            user: me.user,
            company: me.company,
            permissions: me.permissions,
            roles: me.roles,
            sessionId: me.sessionId,
          });
          setInitialized(true);
        }
      } catch {
        const refreshToken = getRefreshToken();
        if (usesHttpOnlyCookies() || refreshToken) {
          try {
            const refreshed = await refreshTokens(refreshToken ?? undefined);
            setTokens(refreshed.tokens.accessToken, refreshed.tokens.refreshToken);
            const me = await fetchMe();
            if (!cancelled) {
              setSession({
                user: me.user,
                company: me.company,
                permissions: me.permissions,
                roles: me.roles,
                sessionId: me.sessionId,
              });
              setInitialized(true);
            }
            return;
          } catch {
            // fall through
          }
        }
        if (!cancelled) {
          clearAuth();
          setInitialized(true);
        }
      }
    }

    void bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, [clearAuth, setInitialized, setLoading, setSession, setTokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      login: async (payload) => {
        const result = await loginRequest(payload);
        setTokens(result.tokens.accessToken, result.tokens.refreshToken);
        const me = await fetchMe();
        setSession({
          user: me.user,
          company: me.company,
          permissions: me.permissions,
          roles: me.roles,
          sessionId: me.sessionId,
        });
        setInitialized(true);
      },
      logout: async () => {
        const refreshToken = getRefreshToken() ?? undefined;
        try {
          await logoutRequest(refreshToken);
        } finally {
          queryClient.clear();
          clearAuth();
        }
      },
    }),
    [clearAuth, queryClient, setInitialized, setSession, setTokens],
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
