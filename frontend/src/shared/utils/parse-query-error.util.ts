import {
  parseMutationError,
  type ParsedMutationError,
} from '@/shared/feedback/mutation-error.util';

export type ParsedQueryError = ParsedMutationError;

/** Normalize React Query / axios failures into user-facing copy (same rules as mutations). */
export function parseQueryError(error: unknown): ParsedQueryError {
  return parseMutationError(error);
}
