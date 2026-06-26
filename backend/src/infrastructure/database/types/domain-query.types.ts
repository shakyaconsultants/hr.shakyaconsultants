import type { QueryFilter, UpdateQuery } from 'mongoose';
import type { BaseDocumentFields } from '@infrastructure/database/types/base-document.types.js';

/**
 * Bounded MongoDB query types shared by all repositories.
 * Avoids per-entity QueryFilter instantiation that exhausts the TypeScript compiler heap.
 */
export type DomainQueryFilter = QueryFilter<BaseDocumentFields & Record<string, unknown>>;
export type DomainUpdateQuery = UpdateQuery<BaseDocumentFields & Record<string, unknown>>;
