import { isProduction } from '@config/env.js';

const INTERNAL_ERROR_PATTERNS = [
  /mongodb/i,
  /mongoose/i,
  /redis/i,
  /ioredis/i,
  /cloudinary/i,
  /smtp/i,
  /econnrefused/i,
  /enotfound/i,
  /stack/i,
  /at\s+\S+\.(ts|js):\d+/i,
  /\/(?:src|node_modules)\//i,
];

export function sanitizeClientErrorMessage(message: string, isOperational: boolean): string {
  if (!isProduction()) {
    return message;
  }

  if (!isOperational) {
    return 'An unexpected error occurred. Please try again later.';
  }

  for (const pattern of INTERNAL_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return 'The request could not be completed. Please try again later.';
    }
  }

  return message;
}

export function sanitizeImportRowError(row: number, rawMessage: string): string {
  if (!isProduction()) {
    return rawMessage.startsWith('Row ') ? rawMessage : `Row ${row + 2}: ${rawMessage}`;
  }
  return `Row ${row + 2}: Import failed due to invalid or duplicate data.`;
}

export function sanitizeImportBatchError(): string {
  return isProduction()
    ? 'Organization import failed due to invalid data.'
    : 'Organization import failed';
}
