import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';

export interface CursorPaginationOptions {
  limit?: number;
  cursorField?: string;
  cursor?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function buildCursorFilter(
  options: CursorPaginationOptions,
): DomainQueryFilter {
  const field = options.cursorField ?? 'id';
  if (!options.cursor) {
    return {};
  }

  const operator = options.sortOrder === 'asc' ? '$gt' : '$lt';
  return { [field]: { [operator]: options.cursor } };
}

export function resolveCursorLimit(limit?: number): number {
  return Math.min(100, Math.max(1, limit ?? 20));
}

export function extractNextCursor(
  items: Record<string, unknown>[],
  cursorField = 'id',
): string | null {
  if (items.length === 0) {
    return null;
  }
  const last = items[items.length - 1];
  const value = last[cursorField];
  return typeof value === 'string' ? value : null;
}
