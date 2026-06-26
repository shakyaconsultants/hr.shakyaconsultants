import { CacheService } from '@infrastructure/redis/cache.service.js';
import { CacheEntryRepository } from '@infrastructure/cache/cache-entry.schema.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

const DEFAULT_TTL_SECONDS = 300;
const SYSTEM_ACTOR = 'system';

export const MasterDataCacheService = {
  buildKey(companyId: string, entityType: string, suffix: string): string {
    return `master:${companyId}:${entityType}:${suffix}`;
  },

  async get(key: string): Promise<string | null> {
    const redisValue = await CacheService.get(key);
    if (redisValue !== null) {
      return redisValue;
    }

    const entry = await CacheEntryRepository.findOne({
      cacheKey: key,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    return entry?.value ?? null;
  },

  async set(key: string, value: string, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    await CacheService.set(key, value, ttlSeconds);

    const expiresAt = ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : null;
    const existing = await CacheEntryRepository.findOne({ cacheKey: key });

    if (existing) {
      await CacheEntryRepository.update(
        existing.id,
        { $set: { value, expiresAt, updatedBy: SYSTEM_ACTOR } },
      );
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
  },

  async del(key: string): Promise<void> {
    await CacheService.del(key);
    const entry = await CacheEntryRepository.findOne({ cacheKey: key });
    if (entry) {
      await CacheEntryRepository.softDelete(entry.id, SYSTEM_ACTOR);
    }
  },

  async invalidateEntity(companyId: string, entityType: string): Promise<void> {
    const prefix = `master:${companyId}:${entityType}:`;
    await CacheService.del(`${prefix}list`);
    await CacheService.del(`${prefix}active-list`);

    const entries = await CacheEntryRepository.findMany({
      cacheKey: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
    });

    await Promise.all(entries.map((entry) => this.del(entry.cacheKey)));
  },

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJson(key: string, value: unknown, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  },
};
