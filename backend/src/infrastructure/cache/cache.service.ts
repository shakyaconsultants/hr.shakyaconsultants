import { CacheEntryRepository } from '@infrastructure/cache/cache-entry.schema.js';
import { MongoServerError } from 'mongodb';
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

  try {
    await CacheEntryRepository.create({
      id: generateUuid(),
      companyId: SYSTEM_ACTOR,
      cacheKey: key,
      value,
      expiresAt,
      createdBy: SYSTEM_ACTOR,
      updatedBy: SYSTEM_ACTOR,
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const raced = await CacheEntryRepository.findOne({ cacheKey: key });
      if (raced) {
        await CacheEntryRepository.update(raced.id, {
          $set: { value, expiresAt, updatedBy: SYSTEM_ACTOR },
        });
        return;
      }
    }
    throw error;
  }
}

export const CacheService = {
  isEnabled(): boolean {
    return true;
  },

  async get(key: string): Promise<string | null> {
    return getMongoCacheValue(key);
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    await setMongoCacheValue(key, value, ttlSeconds);
    return true;
  },

  async setReplayKey(key: string, ttlSeconds: number): Promise<void> {
    await setMongoCacheValue(key, '1', ttlSeconds);
  },

  async existsReplayKey(key: string): Promise<boolean> {
    const value = await getMongoCacheValue(key);
    return value !== null;
  },

  async del(key: string): Promise<boolean> {
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
