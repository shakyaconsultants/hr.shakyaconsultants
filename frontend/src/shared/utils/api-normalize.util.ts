import type { PaginationMeta, PaginatedResult } from '@/shared/types/api.types';

/** Safely coerce unknown API values to arrays. */
export function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/** Safely coerce unknown API values to string-keyed record maps. */
export function asRecord<T>(value: Record<string, T> | null | undefined): Record<string, T> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}

/** Normalize kanban payloads where backend may use `board` instead of `columns`. */
export function normalizeKanbanPayload<TStage, TItem>(payload: {
  stages?: TStage[];
  columns?: Record<string, TItem[]>;
  board?: Record<string, TItem[]>;
}): { stages: TStage[]; columns: Record<string, TItem[]> } {
  const columns = payload.columns ?? payload.board ?? {};
  return {
    stages: asArray(payload.stages),
    columns: asRecord(columns),
  };
}

/**
 * Unwrap standard API success bodies where items live in `data` and totals in root `pagination`.
 * Backend ResponseService.paginated uses: { success, data: T[], pagination: {...} }
 */
export function unwrapApiPaginated<T>(
  body: { data?: T[] | PaginatedResult<T>; pagination?: PaginationMeta } | null | undefined,
  fallbackPageSize = 20,
): PaginatedResult<T> {
  const raw = body?.data;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'items' in raw) {
    return raw as PaginatedResult<T>;
  }

  const items = asArray(raw as T[] | undefined);
  const pagination = body?.pagination ?? {
    page: 1,
    pageSize: fallbackPageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / fallbackPageSize)),
  };

  return { items, pagination };
}

/** Normalize paginated API payloads that return `{ items, total, page, pageSize }` directly. */
export function normalizePaginatedItems<T>(
  payload: T[] | PaginatedResult<T> | null | undefined,
  fallbackPageSize = 20,
  rootPagination?: PaginationMeta,
): PaginatedResult<T> {
  if (rootPagination && Array.isArray(payload)) {
    return { items: payload, pagination: rootPagination };
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'items' in payload) {
    return payload as PaginatedResult<T>;
  }

  const items = asArray(payload as T[] | undefined);
  const total = items.length;

  return {
    items,
    pagination: {
      page: 1,
      pageSize: fallbackPageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / fallbackPageSize)),
    },
  };
}

/**
 * Unwrap composite API payloads like `{ candidate: {...} }` or `{ employee: {...} }`.
 * Keeps frontend aligned with backend detail endpoints without duplicating domain data.
 */
export function unwrapEntityPayload<T>(
  payload: T | Record<string, unknown> | null | undefined,
  entityKeys: string[] = ['candidate', 'employee', 'lead', 'record', 'item', 'data'],
): T {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload as T;
  }

  const record = payload as Record<string, unknown>;
  for (const key of entityKeys) {
    const nested = record[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as T;
    }
  }

  return payload as T;
}
