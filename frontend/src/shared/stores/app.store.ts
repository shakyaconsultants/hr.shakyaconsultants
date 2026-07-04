import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SUPER_ADMIN_ROLE_SLUG } from '@/config/roles.constants';
import type { FeatureFlags } from '@/config/module-registry';
import type { PortalType } from '@/config/portals';
import { clearStoredTokens, setStoredTokens } from '@/shared/auth/token-storage';

import { AUTH_STATUS, type AuthStatus } from '@/shared/auth/auth-status.constants';

export type { AuthStatus };

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

export interface AuthEmployeeProfile {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  designationId: string;
  branchId?: string;
  reportingManagerId?: string;
  employmentType: string;
  status: string;
  joinedAt: string;
}

export interface SessionNavigationItem {
  id: string;
  enabled: boolean;
  order: number;
  label?: string;
  icon?: string;
  portals?: string[];
  path?: string;
}

interface AuthState {
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  company: AuthCompany | null;
  employee: AuthEmployeeProfile | null;
  permissions: string[];
  roles: AuthRole[];
  portal: PortalType | null;
  homeRoute: string | null;
  navigation: SessionNavigationItem[];
  featureFlags: FeatureFlags;
  sessionId: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setSession: (payload: {
    user: AuthUser;
    company: AuthCompany;
    employee?: AuthEmployeeProfile | null;
    permissions: string[];
    roles: AuthRole[];
    portal: PortalType;
    homeRoute: string;
    navigation: SessionNavigationItem[];
    featureFlags: FeatureFlags;
    sessionId: string;
  }) => void;
  setAuthStatus: (status: AuthStatus) => void;
  setSessionNavigation: (items: SessionNavigationItem[]) => void;
  setSessionFeatureFlags: (flags: FeatureFlags) => void;
  clearAuth: () => void;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  isSuperAdmin: () => boolean;
}

const emptyFeatureFlags = {} as FeatureFlags;

const initialState = {
  authStatus: AUTH_STATUS.LOADING as AuthStatus,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
  user: null,
  company: null,
  employee: null,
  permissions: [] as string[],
  roles: [] as AuthRole[],
  portal: null,
  homeRoute: null,
  navigation: [] as SessionNavigationItem[],
  featureFlags: emptyFeatureFlags,
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
      employee: payload.employee ?? null,
      permissions: payload.permissions,
      roles: payload.roles,
      portal: payload.portal,
      homeRoute: payload.homeRoute,
      navigation: payload.navigation,
      featureFlags: payload.featureFlags,
      sessionId: payload.sessionId,
      isAuthenticated: true,
    }),
  setAuthStatus: (status) =>
    set({
      authStatus: status,
      isAuthenticated: status === AUTH_STATUS.AUTHENTICATED,
      isInitialized: status !== AUTH_STATUS.LOADING,
      isLoading: status === AUTH_STATUS.LOADING,
    }),
  setSessionNavigation: (items) => set({ navigation: items }),
  setSessionFeatureFlags: (flags) => set({ featureFlags: flags }),
  clearAuth: () => {
    clearStoredTokens();
    set({
      ...initialState,
      authStatus: AUTH_STATUS.UNAUTHENTICATED,
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

export function selectLinkedEmployeeId(state: Pick<AuthState, 'employee' | 'user'>): string | undefined {
  return state.employee?.id ?? state.user?.employeeId ?? undefined;
}

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
