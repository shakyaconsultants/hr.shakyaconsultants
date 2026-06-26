import { type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';

export interface CacheEntryDocument extends BaseDocument {
  cacheKey: string;
  value: string;
  expiresAt: Date | null;
}

const cacheEntryFields: SchemaDefinition = {
  cacheKey: { type: String, required: true, trim: true, index: true },
  value: { type: String, required: true },
  expiresAt: { type: Date, default: null, index: true },
};

export const cacheEntryModel = defineDomainModel<CacheEntryDocument>(
  'CacheEntry',
  COLLECTIONS.CACHE_ENTRIES,
  cacheEntryFields,
  {
    withCompanyScope: false,
    indexes: [
      { fields: { cacheKey: 1 }, options: { unique: true, name: 'uq_cache_entries_key' } },
      { fields: { expiresAt: 1 }, options: { expireAfterSeconds: 0, name: 'ttl_cache_entries_expires' } },
    ],
  },
);

export const CacheEntryRepository = cacheEntryModel.repository;
