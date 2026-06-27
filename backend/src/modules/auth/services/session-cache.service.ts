const SESSION_CACHE_TTL_MS = 30_000;
const MAX_SESSION_CACHE_ENTRIES = 5_000;

interface SessionCacheEntry {
  valid: boolean;
  expiresAt: number;
}

const sessionCache = new Map<string, SessionCacheEntry>();

function buildSessionCacheKey(companyId: string, sessionId: string): string {
  return `${companyId}:${sessionId}`;
}

function pruneSessionCache(): void {
  if (sessionCache.size <= MAX_SESSION_CACHE_ENTRIES) {
    return;
  }

  const now = Date.now();
  for (const [key, entry] of sessionCache.entries()) {
    if (entry.expiresAt <= now) {
      sessionCache.delete(key);
    }
  }
}

export const SessionCacheService = {
  get(companyId: string, sessionId: string): boolean | null {
    const entry = sessionCache.get(buildSessionCacheKey(companyId, sessionId));
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      sessionCache.delete(buildSessionCacheKey(companyId, sessionId));
      return null;
    }
    return entry.valid;
  },

  set(companyId: string, sessionId: string, valid: boolean): void {
    pruneSessionCache();
    sessionCache.set(buildSessionCacheKey(companyId, sessionId), {
      valid,
      expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    });
  },

  invalidate(companyId: string, sessionId: string): void {
    sessionCache.delete(buildSessionCacheKey(companyId, sessionId));
  },

  invalidateUser(companyId: string, userId: string): void {
    const prefix = `${companyId}:`;
    for (const key of sessionCache.keys()) {
      if (key.startsWith(prefix)) {
        sessionCache.delete(key);
      }
    }
    void userId;
  },
};
