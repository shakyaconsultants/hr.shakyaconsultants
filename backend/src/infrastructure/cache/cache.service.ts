import { CacheEntryModel } from '@infrastructure/cache/cache-entry.schema.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

const SYSTEM_ACTOR = 'system';

async function getMongoCacheValue(key: string): Promise<string | null> {
  const entry = await CacheEntryModel.findOne({
    cacheKey: key,
    isDeleted: { $ne: true },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).exec();
  return entry?.value ?? null;
}

async function setMongoCacheValue(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const expiresAt =
    ttlSeconds !== undefined && ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : null;

  await CacheEntryModel.findOneAndUpdate(
    { cacheKey: key },
    {
      $set: {
        value,
        expiresAt,
        updatedBy: SYSTEM_ACTOR,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
      $setOnInsert: {
        id: generateUuid(),
        companyId: SYSTEM_ACTOR,
        cacheKey: key,
        createdBy: SYSTEM_ACTOR,
      },
    },
    { upsert: true, new: true },
  ).exec();
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
    const entry = await CacheEntryModel.findOne({ cacheKey: key, isDeleted: { $ne: true } }).exec();
    if (entry) {
      await CacheEntryModel.updateOne(
        { id: entry.id },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: SYSTEM_ACTOR,
            updatedBy: SYSTEM_ACTOR,
          },
        },
      ).exec();
    }
    return true;
  },

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  },
};
