import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';

export function buildSearchFilter(
  term: string,
  fields: string[],
): DomainQueryFilter {
  const trimmed = term.trim();
  if (!trimmed || fields.length === 0) {
    return {};
  }

  const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
}

export function buildTextSearchFilter(term: string): DomainQueryFilter {
  const trimmed = term.trim();
  if (!trimmed) {
    return {};
  }
  return { $text: { $search: trimmed } };
}
