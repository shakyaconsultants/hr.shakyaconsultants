import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';

export interface DateRangeOptions {
  field?: string;
  from?: Date | string;
  to?: Date | string;
}

export function buildDateRangeFilter(options: DateRangeOptions): DomainQueryFilter {
  const field = options.field ?? 'createdAt';
  const range: Record<string, Date> = {};

  if (options.from) {
    range.$gte = new Date(options.from);
  }
  if (options.to) {
    range.$lte = new Date(options.to);
  }

  if (Object.keys(range).length === 0) {
    return {};
  }

  return { [field]: range };
}
