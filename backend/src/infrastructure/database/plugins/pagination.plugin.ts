import type { Schema, Model } from 'mongoose';
import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import {
  buildPaginationResult,
  type PaginationQueryOptions,
} from '@infrastructure/database/query/pagination.helper.js';

export function paginationPlugin(schema: Schema): void {
  schema.statics.paginate = async function paginate<T>(
    this: Model<T>,
    filter: DomainQueryFilter,
    options: PaginationQueryOptions,
  ) {
    return buildPaginationResult(this, filter, options);
  };
}
