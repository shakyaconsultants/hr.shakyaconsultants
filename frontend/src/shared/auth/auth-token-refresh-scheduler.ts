import {
  clearAccessTokenExpiry,
  isAccessTokenNearExpiry,
  msUntilAccessTokenExpiry,
  msUntilProactiveRefresh,
  rememberAccessTokenExpiry,
} from '@/shared/auth/auth-token-lifetime';

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let visibilityListenerAttached = false;

function clearRefreshTimer(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

async function runProactiveRefresh(): Promise<void> {
  const { refreshAccessTokenOnce } = await import('@/shared/auth/auth-session');
  const result = await refreshAccessTokenOnce();
  if (result === 'invalid') {
    stopProactiveTokenRefresh();
    return;
  }
  if (result === 'unavailable') {
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void runProactiveRefresh();
    }, 60_000);
  }
}

export function scheduleProactiveTokenRefresh(expiresIn: string | number): void {
  rememberAccessTokenExpiry(expiresIn);
  clearRefreshTimer();

  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void runProactiveRefresh();
  }, msUntilProactiveRefresh(expiresIn));

  attachVisibilityRefreshListener();
}

/** Schedule from stored expiry, or fall back to a fresh TTL when unknown. */
export function ensureProactiveRefreshScheduled(fallbackExpiresIn: string | number = '8h'): void {
  const remaining = msUntilAccessTokenExpiry();
  if (remaining !== null && remaining > 0) {
    clearRefreshTimer();
    const leadMs = Math.min(2 * 60 * 1000, Math.max(60_000, remaining * 0.2));
    refreshTimer = setTimeout(
      () => {
        refreshTimer = null;
        void runProactiveRefresh();
      },
      Math.max(30_000, remaining - leadMs),
    );
    attachVisibilityRefreshListener();
    return;
  }

  scheduleProactiveTokenRefresh(fallbackExpiresIn);
}

export function stopProactiveTokenRefresh(): void {
  clearRefreshTimer();
  clearAccessTokenExpiry();
}

function attachVisibilityRefreshListener(): void {
  if (visibilityListenerAttached || typeof document === 'undefined') {
    return;
  }

  visibilityListenerAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      return;
    }
    if (isAccessTokenNearExpiry()) {
      void runProactiveRefresh();
    }
  });
}
