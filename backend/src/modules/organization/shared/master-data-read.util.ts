import type { PaginatedResult } from '@shared/types/api.types.js';
import type { CursorPaginationResult } from '@infrastructure/database/query/cursor-pagination.helper.js';
import { serializeMasterDataRecord, serializeMasterDataRecords } from '@shared/utils/document.util.js';

/** Ensure list/get responses are plain JSON-safe records (never raw Mongoose docs). */
export function serializePaginatedMasterData<T>(result: PaginatedResult<T>): PaginatedResult<T> {
  return {
    ...result,
    items: serializeMasterDataRecords(result.items),
  };
}

export function serializeCursorMasterData<T>(result: CursorPaginationResult<T>): CursorPaginationResult<T> {
  return {
    ...result,
    items: serializeMasterDataRecords(result.items),
  };
}

export { serializeMasterDataRecord, serializeMasterDataRecords };
