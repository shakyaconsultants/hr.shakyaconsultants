import { CacheEntryRepository } from '@infrastructure/cache/cache-entry.schema.js';
import { getRedisClient, isRedisAvailable } from '@infrastructure/redis/redis.client.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

const SYSTEM_ACTOR = 'system';

async function getMongoCacheValue(key: string): Promise<string | null> {
  const entry = await CacheEntryRepository.findOne({
    cacheKey: key,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  return entry?.value ?? null;
}

async function setMongoCacheValue(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const expiresAt =
    ttlSeconds !== undefined && ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : null;
  const existing = await CacheEntryRepository.findOne({ cacheKey: key });

  if (existing) {
    await CacheEntryRepository.update(existing.id, {
      $set: { value, expiresAt, updatedBy: SYSTEM_ACTOR },
    });
    return;
  }

  await CacheEntryRepository.create({
    id: generateUuid(),
    companyId: SYSTEM_ACTOR,
    cacheKey: key,
    value,
    expiresAt,
    createdBy: SYSTEM_ACTOR,
    updatedBy: SYSTEM_ACTOR,
  });
}

export const CacheService = {
  isEnabled(): boolean {
    return isRedisAvailable();
  },

  async get(key: string): Promise<string | null> {
    if (isRedisAvailable()) {
      try {
        const value = await getRedisClient().get(key);
        if (value !== null) {
          return value;
        }
      } catch {
        // Fall through to Mongo when Redis is temporarily unavailable.
      }
    }

    return getMongoCacheValue(key);
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (isRedisAvailable()) {
      try {
        const client = getRedisClient();
        if (ttlSeconds !== undefined && ttlSeconds > 0) {
          await client.set(key, value, 'EX', ttlSeconds);
        } else {
          await client.set(key, value);
        }
        void setMongoCacheValue(key, value, ttlSeconds).catch(() => undefined);
        return true;
      } catch {
        // Fall through to Mongo-only persistence.
      }
    }

    await setMongoCacheValue(key, value, ttlSeconds);
    return true;
  },

  /** Redis-only replay marker — never blocks auth when Redis is unavailable. */
  async setReplayKey(key: string, ttlSeconds: number): Promise<void> {
    if (!isRedisAvailable()) {
      return;
    }

    try {
      await getRedisClient().set(key, '1', 'EX', ttlSeconds);
    } catch {
      // Replay protection is best-effort when Redis is unavailable.
    }
  },

  /** Redis-only replay lookup — returns false when Redis is unavailable. */
  async existsReplayKey(key: string): Promise<boolean> {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const value = await getRedisClient().get(key);
      return value !== null;
    } catch {
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (isRedisAvailable()) {
      try {
        await getRedisClient().del(key);
      } catch {
        // Continue with Mongo cleanup.
      }
    }

    const entry = await CacheEntryRepository.findOne({ cacheKey: key });
    if (entry) {
      await CacheEntryRepository.softDelete(entry.id, SYSTEM_ACTOR);
    }
    return true;
  },

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  },
};
