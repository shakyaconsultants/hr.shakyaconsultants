import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';

export type FilterValue = string | number | boolean | Date | null | undefined;

export function buildExactFilter(
  fields: Record<string, FilterValue>,
): DomainQueryFilter {
  const filter: Record<string, FilterValue> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      filter[key] = value;
    }
  }
  return filter;
}

export function buildInFilter(field: string, values: FilterValue[]): DomainQueryFilter {
  return { [field]: { $in: values } };
}

export function mergeFilters(...filters: DomainQueryFilter[]): DomainQueryFilter {
  return filters.reduce<DomainQueryFilter>(
    (merged, filter) => ({ ...merged, ...filter }),
    {},
  );
}

export function buildCompanyFilter(companyId: string): DomainQueryFilter {
  return { companyId };
}
