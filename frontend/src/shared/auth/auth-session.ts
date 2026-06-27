import type { QueryClient } from '@tanstack/react-query';
import { fetchMe, refreshTokens } from '@/features/auth/api/auth.api';
import type { MeResult } from '@/features/auth/api/auth.api';
import { fetchNavigationConfig } from '@/features/configuration/api/configuration.api';
import { fetchSettingsByGroup } from '@/features/admin/api/settings.api';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/config/module-registry';
import {
  getRefreshToken,
  hasStoredAuth,
  markCookieSessionActive,
  setStoredTokens,
  usesHttpOnlyCookies,
} from '@/shared/auth/token-storage';

let bootstrapActive = false;
let sessionRestorePromise: Promise<MeResult | null> | null = null;
let refreshInFlight: Promise<boolean> | null = null;

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
      return false;
    }

    try {
      const result = await refreshTokens(refreshToken ?? undefined);
      setStoredTokens(result.tokens.accessToken, result.tokens.refreshToken);
      if (usesHttpOnlyCookies()) {
        markCookieSessionActive();
      }
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function restoreSession(): Promise<MeResult | null> {
  if (sessionRestorePromise) {
    return sessionRestorePromise;
  }

  sessionRestorePromise = performSessionRestore().finally(() => {
    sessionRestorePromise = null;
  });

  return sessionRestorePromise;
}

async function performSessionRestore(): Promise<MeResult | null> {
  if (!usesHttpOnlyCookies() && !hasStoredAuth()) {
    return null;
  }

  bootstrapActive = true;
  try {
    return await fetchMe();
  } catch {
    return null;
  } finally {
    bootstrapActive = false;
  }
}

async function prefetchFeatureFlags(): Promise<FeatureFlags> {
  try {
    const settings = await fetchSettingsByGroup('feature_flags');
    if (settings.length === 0) {
      return DEFAULT_FEATURE_FLAGS;
    }
    const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
    for (const setting of settings) {
      const flagKey = setting.key.replace(/^feature\./, '');
      flags[flagKey] = Boolean(setting.value);
    }
    return flags;
  } catch {
    return DEFAULT_FEATURE_FLAGS;
  }
}

export async function prefetchAuthenticatedResources(queryClient: QueryClient): Promise<void> {
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['configuration', 'navigation'],
      queryFn: fetchNavigationConfig,
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['feature-flags'],
      queryFn: prefetchFeatureFlags,
      staleTime: 60_000,
    }),
  ]);
}
