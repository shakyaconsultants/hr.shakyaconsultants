import type { PaginationMeta } from '@shared/types/api.types.js';

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export function calculatePagination(total: number, page: number, pageSize: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { page, pageSize, total, totalPages };
}

export function getSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function paginateArray<T>(items: T[], page: number, pageSize: number): T[] {
  const skip = getSkip(page, pageSize);
  return items.slice(skip, skip + pageSize);
}
