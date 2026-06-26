import type { ErrorCode } from '@shared/constants/error-codes.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { HTTP_STATUS } from '@shared/constants/http.constants.js';

export interface ErrorMetadata {
  [key: string]: unknown;
}

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  statusCode: number;
  isOperational?: boolean;
  metadata?: ErrorMetadata;
  details?: unknown[];
  correlationId?: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly metadata: ErrorMetadata;
  readonly details: unknown[];
  readonly correlationId?: string;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.isOperational = options.isOperational ?? true;
    this.metadata = options.metadata ?? {};
    this.details = options.details ?? [];
    this.correlationId = options.correlationId;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      metadata: this.metadata,
      details: this.details,
      correlationId: this.correlationId,
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

function withCorrelation(options: Omit<AppErrorOptions, 'correlationId'>, correlationId?: string): AppErrorOptions {
  return { ...options, correlationId };
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown[], metadata?: ErrorMetadata, correlationId?: string) {
    super(withCorrelation({
      code: ERROR_CODES.VALIDATION_FAILED,
      message,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      details,
      metadata,
    }, correlationId));
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata, correlationId?: string) {
    super(withCorrelation({ code: ERROR_CODES.BAD_REQUEST, message, statusCode: HTTP_STATUS.BAD_REQUEST, metadata }, correlationId));
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.AUTH_UNAUTHORIZED, correlationId?: string) {
    super(withCorrelation({ code, message, statusCode: HTTP_STATUS.UNAUTHORIZED }, correlationId));
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, correlationId?: string) {
    super(withCorrelation({ code: ERROR_CODES.INVALID_PERMISSION, message, statusCode: HTTP_STATUS.FORBIDDEN }, correlationId));
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, correlationId?: string) {
    super(withCorrelation({ code: ERROR_CODES.AUTH_FORBIDDEN, message, statusCode: HTTP_STATUS.FORBIDDEN }, correlationId));
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.NOT_FOUND, correlationId?: string) {
    super(withCorrelation({ code, message, statusCode: HTTP_STATUS.NOT_FOUND }, correlationId));
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.CONFLICT, metadata?: ErrorMetadata, correlationId?: string) {
    super(withCorrelation({ code, message, statusCode: HTTP_STATUS.CONFLICT, metadata }, correlationId));
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata, correlationId?: string) {
    super(withCorrelation({ code: ERROR_CODES.RATE_LIMIT_EXCEEDED, message, statusCode: HTTP_STATUS.TOO_MANY_REQUESTS, metadata }, correlationId));
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata, correlationId?: string) {
    super(withCorrelation({
      code: ERROR_CODES.DATABASE_ERROR,
      message,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      isOperational: false,
      metadata,
    }, correlationId));
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata, correlationId?: string) {
    super(withCorrelation({
      code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      message,
      statusCode: 502,
      metadata,
    }, correlationId));
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', correlationId?: string) {
    super(withCorrelation({
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      isOperational: false,
    }, correlationId));
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', correlationId?: string) {
    super(withCorrelation({ code: ERROR_CODES.SERVICE_UNAVAILABLE, message, statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE }, correlationId));
  }
}
