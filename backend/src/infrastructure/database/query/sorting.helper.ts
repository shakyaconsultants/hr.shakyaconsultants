import type { SortOrder } from 'mongoose';

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function buildSort(options: SortOptions): Record<string, SortOrder> {
  const sortBy = options.sortBy ?? 'createdAt';
  const sortOrder: SortOrder = options.sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: sortOrder };
}

export function buildMultiSort(
  sorts: Array<{ field: string; order?: 'asc' | 'desc' }>,
): Record<string, SortOrder> {
  return sorts.reduce<Record<string, SortOrder>>((acc, item) => {
    acc[item.field] = item.order === 'asc' ? 1 : -1;
    return acc;
  }, {});
}
