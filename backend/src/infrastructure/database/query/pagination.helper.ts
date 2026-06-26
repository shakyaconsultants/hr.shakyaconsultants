import type { Model, SortOrder } from 'mongoose';
import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import type { DomainMongooseOptions } from '@infrastructure/database/types/domain-mongoose-options.types.js';
import { getSkip } from '@shared/utils/pagination.util.js';
import type { PaginatedResult } from '@shared/types/api.types.js';

export interface PaginationQueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  companyId?: string;
  includeDeleted?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  sort: Record<string, SortOrder>;
}

export function resolvePaginationParams(options: PaginationQueryOptions): PaginationParams {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
  const sortBy = options.sortBy ?? 'createdAt';
  const sortOrder: SortOrder = options.sortOrder === 'asc' ? 1 : -1;

  return {
    page,
    pageSize,
    skip: getSkip(page, pageSize),
    sort: { [sortBy]: sortOrder },
  };
}

export async function buildPaginationResult<T>(
  model: Model<T>,
  filter: DomainQueryFilter,
  options: PaginationQueryOptions,
): Promise<PaginatedResult<T>> {
  const { page, pageSize, skip, sort } = resolvePaginationParams(options);
  const queryOptions: DomainMongooseOptions = {
    companyId: options.companyId,
    includeDeleted: options.includeDeleted,
  };

  const [items, total] = await Promise.all([
    model.find(filter, null, queryOptions).sort(sort).skip(skip).limit(pageSize).exec(),
    model.countDocuments(filter).setOptions(queryOptions).exec(),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
