import { CacheService } from '@infrastructure/redis/cache.service.js';

const DEFAULT_TTL_SECONDS = 300;

export const MasterDataCacheService = {
  buildKey(companyId: string, entityType: string, suffix: string): string {
    return `master:${companyId}:${entityType}:${suffix}`;
  },

  async get(key: string): Promise<string | null> {
    return CacheService.get(key);
  },

  async set(key: string, value: string, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    await CacheService.set(key, value, ttlSeconds);
  },

  async del(key: string): Promise<void> {
    await CacheService.del(key);
  },

  async invalidateEntity(companyId: string, entityType: string): Promise<void> {
    const prefix = `master:${companyId}:${entityType}:`;
    await CacheService.del(`${prefix}list`);
    await CacheService.del(`${prefix}active-list`);
  },

  async invalidateRecord(companyId: string, entityType: string, id: string): Promise<void> {
    await this.del(this.buildKey(companyId, entityType, id));
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
