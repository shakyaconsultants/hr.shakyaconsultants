import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { HTTP_STATUS } from '@shared/constants/http.constants.js';
import { isProduction } from '@config/env.js';
import { isAppError, InternalServerError, type AppError } from '@shared/errors/app.error.js';
import { ResponseService } from '@shared/services/response.service.js';
import type { ApiErrorResponse } from '@shared/types/api.types.js';
import { errorLogger } from '@logging/winston.logger.js';
import { sanitizeClientErrorMessage } from '@shared/utils/production-sanitize.util.js';
import { redactObject } from '@shared/utils/sensitive-redact.util.js';
import { normalizeDatabaseError } from '@shared/utils/database-error.util.js';

function logServerError(
  label: string,
  req: Request,
  err: Error,
  extra?: Record<string, unknown>,
): void {
  const payload = redactObject({
    ...extra,
    message: err.message,
    stack: err.stack,
    correlationId: req.correlationId,
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
  });

  errorLogger.error(label, payload);
  console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${label}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
}

export const ErrorHandlerService = {
  buildErrorResponse(
    req: Request,
    statusCode: number,
    code: string,
    message: string,
    details: unknown[] = [],
    metadata: Record<string, unknown> = {},
  ): ApiErrorResponse {
    return {
      success: false,
      statusCode,
      error: {
        code,
        message,
        details,
        metadata,
        correlationId: req.correlationId,
      },
      meta: ResponseService.buildMeta(req),
    };
  },

  handleZodError(req: Request, res: Response, err: ZodError): void {
    if (!isProduction()) {
      logServerError('Validation failed', req, err);
    }

    const body = this.buildErrorResponse(
      req,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_FAILED,
      'Validation failed',
      err.issues,
    );
    res.status(HTTP_STATUS.BAD_REQUEST).json(body);
  },

  handleAppError(req: Request, res: Response, err: AppError): void {
    if (!err.isOperational || !isProduction()) {
      logServerError(err.isOperational ? 'Operational error' : 'Non-operational error', req, err, {
        code: err.code,
        statusCode: err.statusCode,
      });
    }

    const body = this.buildErrorResponse(
      req,
      err.statusCode,
      err.code,
      sanitizeClientErrorMessage(err.message, err.isOperational),
      err.details,
      err.metadata,
    );
    res.status(err.statusCode).json(body);
  },

  handleUnknownError(req: Request, res: Response, err: unknown): void {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const stack = err instanceof Error ? err.stack : undefined;

    logServerError('Unhandled error', req, err instanceof Error ? err : new Error(message));

    const clientMessage = isProduction()
      ? new InternalServerError(undefined, req.correlationId).message
      : message;

    const body = this.buildErrorResponse(
      req,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      clientMessage,
      isProduction() || !stack ? [] : [{ message, stack }],
    );
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(body);
  },
};

export function notFoundHandler(req: Request, res: Response): void {
  const body = ErrorHandlerService.buildErrorResponse(
    req,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.ROUTE_NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`,
  );
  res.status(HTTP_STATUS.NOT_FOUND).json(body);
}

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    ErrorHandlerService.handleZodError(req, res, err);
    return;
  }

  const dbError = normalizeDatabaseError(err);
  if (dbError) {
    ErrorHandlerService.handleAppError(req, res, dbError);
    return;
  }

  if (isAppError(err)) {
    ErrorHandlerService.handleAppError(req, res, err);
    return;
  }

  ErrorHandlerService.handleUnknownError(req, res, err);
}
