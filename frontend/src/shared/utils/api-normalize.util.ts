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

/** Normalize paginated API payloads that return `{ items, total, page, pageSize }` directly. */
export function normalizePaginatedItems<T>(
  payload: T[] | { items?: T[]; pagination?: { page: number; pageSize: number; total: number; totalPages: number } } | null | undefined,
  fallbackPageSize = 20,
): { items: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } } {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      pagination: { page: 1, pageSize: fallbackPageSize, total: payload.length, totalPages: 1 },
    };
  }

  const items = asArray(payload?.items);
  const total = payload && 'pagination' in payload && payload.pagination?.total != null
    ? payload.pagination.total
    : items.length;

  return {
    items,
    pagination: payload?.pagination ?? {
      page: 1,
      pageSize: fallbackPageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / fallbackPageSize)),
    },
  };
}
