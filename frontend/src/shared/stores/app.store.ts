import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SUPER_ADMIN_ROLE_SLUG } from '@/config/roles.constants';
import { clearStoredTokens, setStoredTokens } from '@/shared/auth/token-storage';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  email: string;
  status: string;
  employeeId?: string;
}

export interface AuthCompany {
  id: string;
  name: string;
  code: string;
}

export interface AuthRole {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  company: AuthCompany | null;
  permissions: string[];
  roles: AuthRole[];
  sessionId: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setSession: (payload: {
    user: AuthUser;
    company: AuthCompany;
    permissions: string[];
    roles: AuthRole[];
    sessionId: string;
  }) => void;
  setAuthStatus: (status: AuthStatus) => void;
  clearAuth: () => void;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  isSuperAdmin: () => boolean;
}

const initialState = {
  authStatus: 'loading' as AuthStatus,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
  user: null,
  company: null,
  permissions: [] as string[],
  roles: [] as AuthRole[],
  sessionId: null,
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  ...initialState,
  setTokens: (accessToken, refreshToken) => {
    setStoredTokens(accessToken, refreshToken);
  },
  setSession: (payload) =>
    set({
      user: payload.user,
      company: payload.company,
      permissions: payload.permissions,
      roles: payload.roles,
      sessionId: payload.sessionId,
      isAuthenticated: true,
    }),
  setAuthStatus: (status) =>
    set({
      authStatus: status,
      isAuthenticated: status === 'authenticated',
      isInitialized: status !== 'loading',
      isLoading: status === 'loading',
    }),
  clearAuth: () => {
    clearStoredTokens();
    set({
      ...initialState,
      authStatus: 'unauthenticated',
      isInitialized: true,
      isLoading: false,
    });
  },
  hasPermission: (code) => {
    const state = get();
    if (state.isSuperAdmin()) return true;
    return state.permissions.includes(code);
  },
  hasAnyPermission: (codes) => codes.some((code) => get().hasPermission(code)),
  isSuperAdmin: () => get().roles.some((role) => role.slug === SUPER_ADMIN_ROLE_SLUG),
}));

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'hr-shakya-theme' },
  ),
);
