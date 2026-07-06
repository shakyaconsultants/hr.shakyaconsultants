import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';

export function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildSearchFilter(term: string, fields: string[]): DomainQueryFilter {
  const trimmed = term.trim();
  if (!trimmed || fields.length === 0) {
    return {};
  }

  const regex = new RegExp(escapeRegex(trimmed), 'i');
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
}

export function buildRegexFilter(term: string): RegExp {
  return new RegExp(escapeRegex(term.trim()), 'i');
}

export function buildTextSearchFilter(term: string): DomainQueryFilter {
  const trimmed = term.trim();
  if (!trimmed) {
    return {};
  }
  return { $text: { $search: trimmed } };
}
