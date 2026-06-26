import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { fetchMe, loginRequest, logoutRequest, refreshTokens } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/shared/stores/app.store';
import { STORAGE_KEYS } from '@/config/app.config';

interface AuthContextValue {
  login: (payload: { companyCode: string; email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setSession = useAuthStore((s) => s.setSession);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      setLoading(true);
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!accessToken && !refreshToken) {
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
        if (refreshToken) {
          try {
            const refreshed = await refreshTokens(refreshToken);
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
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ?? undefined;
        try {
          await logoutRequest(refreshToken);
        } finally {
          clearAuth();
        }
      },
    }),
    [clearAuth, setInitialized, setSession, setTokens],
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
