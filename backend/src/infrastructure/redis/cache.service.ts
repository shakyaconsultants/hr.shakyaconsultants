import { getRedisClient, isRedisAvailable } from '@infrastructure/redis/redis.client.js';

export const CacheService = {
  isEnabled(): boolean {
    return isRedisAvailable();
  },

  async get(key: string): Promise<string | null> {
    if (!isRedisAvailable()) {
      return null;
    }
    return getRedisClient().get(key);
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!isRedisAvailable()) {
      return false;
    }
    const client = getRedisClient();
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await client.set(key, value, 'EX', ttlSeconds);
    } else {
      await client.set(key, value);
    }
    return true;
  },

  async del(key: string): Promise<boolean> {
    if (!isRedisAvailable()) {
      return false;
    }
    await getRedisClient().del(key);
    return true;
  },

  async exists(key: string): Promise<boolean> {
    if (!isRedisAvailable()) {
      return false;
    }
    const count = await getRedisClient().exists(key);
    return count > 0;
  },
};
