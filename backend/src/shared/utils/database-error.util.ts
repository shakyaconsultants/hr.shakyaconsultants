import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import { ConflictError, ValidationError, type AppError } from '@shared/errors/app.error.js';
import { ERROR_CODES, type ErrorCode } from '@shared/constants/error-codes.js';
import { formatDuplicateKeyValue } from '@shared/utils/safe-string.util.js';

const SKIP_DUPLICATE_FIELDS = new Set(['companyId', '_id']);

const INDEX_DUPLICATE_HINTS: Record<string, { field: string; label: string; code?: ErrorCode }> = {
  uq_employees_company_email: {
    field: 'email',
    label: 'Email',
    code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
  },
  uq_users_company_email: {
    field: 'email',
    label: 'Email',
    code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
  },
  uq_employees_company_number: { field: 'employeeNumber', label: 'Employee number' },
  uq_employees_company_aadhaar: { field: 'aadhaarNumber', label: 'Aadhaar number' },
  uq_employees_company_pan: { field: 'panNumber', label: 'PAN' },
  uq_departments_company_code: { field: 'code', label: 'Department code' },
  uq_designations_company_code: { field: 'code', label: 'Designation code' },
  uq_branches_company_code: { field: 'code', label: 'Branch code' },
  uq_project_drafts_user: { field: 'userId', label: 'Project draft' },
};

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  employeeNumber: 'Employee number',
  aadhaarNumber: 'Aadhaar number',
  panNumber: 'PAN',
  code: 'Code',
  phone: 'Phone',
};

function humanizeField(field: string): string {
  return (
    FIELD_LABELS[field] ?? field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
  );
}

function formatDuplicateValue(field: string, value: unknown): string {
  const formatted = formatDuplicateKeyValue(value);
  if (!formatted) {
    return '';
  }
  if (field === 'email' || field === 'code' || field === 'employeeNumber') {
    return `"${formatted}"`;
  }
  return `"${formatted}"`;
}

function parseIndexName(message: string): string | undefined {
  const match = message.match(/index:\s+(\S+)/);
  return match?.[1];
}

function buildDuplicateConflict(
  field: string,
  value: unknown,
  code: ErrorCode = ERROR_CODES.CONFLICT,
): ConflictError {
  const label = humanizeField(field);
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return new ConflictError(
      'Could not save employee record due to a data conflict. Please contact support if this persists.',
      code,
      { field, value: null, reason: 'DUPLICATE_KEY' },
    );
  }
  const formattedValue = formatDuplicateValue(field, value);
  const message = formattedValue
    ? `${label} ${formattedValue} is already in use`
    : `${label} is already in use`;

  return new ConflictError(message, code, {
    field,
    value,
    reason: 'DUPLICATE_KEY',
  });
}

function duplicateKeyMessage(err: MongoServerError): ConflictError {
  const keyValue = (err.keyValue ?? {}) as Record<string, unknown>;
  const keyPattern = (err.keyPattern ?? {}) as Record<string, unknown>;
  const indexName = parseIndexName(err.message);
  const hint = indexName !== undefined ? INDEX_DUPLICATE_HINTS[indexName] : undefined;

  if (hint !== undefined) {
    return buildDuplicateConflict(
      hint.field,
      keyValue[hint.field],
      hint.code ?? ERROR_CODES.CONFLICT,
    );
  }

  const fields = Object.keys(keyPattern).filter((field) => !SKIP_DUPLICATE_FIELDS.has(field));
  for (const field of ['email', 'employeeNumber', 'aadhaarNumber', 'panNumber', 'code']) {
    if (fields.includes(field)) {
      return buildDuplicateConflict(
        field,
        keyValue[field],
        field === 'email' ? ERROR_CODES.EMAIL_ALREADY_EXISTS : ERROR_CODES.CONFLICT,
      );
    }
  }

  if (fields.length === 1) {
    const field = fields[0];
    return buildDuplicateConflict(field, keyValue[field]);
  }

  if (fields.length > 1) {
    const parts = fields.map((field) => {
      const value = keyValue[field];
      if (value === undefined) {
        return humanizeField(field);
      }
      const formatted = formatDuplicateKeyValue(value);
      return formatted ? `${humanizeField(field)}: ${formatted}` : humanizeField(field);
    });
    return new ConflictError(
      `A record with the same ${parts.join(', ')} already exists`,
      ERROR_CODES.CONFLICT,
      { fields, keyValue, reason: 'DUPLICATE_KEY' },
    );
  }

  return new ConflictError('A record with these details already exists', ERROR_CODES.CONFLICT, {
    keyValue,
    reason: 'DUPLICATE_KEY',
  });
}

export function normalizeDatabaseError(error: unknown): AppError | null {
  if (error instanceof MongoServerError && error.code === 11000) {
    return duplicateKeyMessage(error);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((entry) => ({
      path: entry.path,
      message: entry.message,
    }));
    return new ValidationError('Validation failed', details);
  }

  if (error instanceof mongoose.Error.CastError) {
    return new ValidationError(`Invalid value for ${error.path}`, [
      { path: error.path, message: error.message },
    ]);
  }

  return null;
}
