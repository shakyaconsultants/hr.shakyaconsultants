import type { Schema, Model } from 'mongoose';
import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';

export interface SearchPluginOptions {
  fields: string[];
}

export function searchPlugin(schema: Schema, options: SearchPluginOptions): void {
  schema.statics.searchByTerm = function searchByTerm<T>(
    this: Model<T>,
    baseFilter: DomainQueryFilter,
    term: string,
  ): DomainQueryFilter {
    return {
      ...baseFilter,
      ...buildSearchFilter(term, options.fields),
    };
  };
}
