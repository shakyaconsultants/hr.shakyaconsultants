import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { HTTP_STATUS } from '@shared/constants/http.constants.js';
import { isAppError, InternalServerError, type AppError } from '@shared/errors/app.error.js';
import { ResponseService } from '@shared/services/response.service.js';
import type { ApiErrorResponse } from '@shared/types/api.types.js';
import { errorLogger } from '@logging/winston.logger.js';
import { sanitizeClientErrorMessage } from '@shared/utils/production-sanitize.util.js';
import { redactObject } from '@shared/utils/sensitive-redact.util.js';

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
    if (!err.isOperational) {
      errorLogger.error('Non-operational error', redactObject({
        code: err.code,
        message: err.message,
        stack: err.stack,
        correlationId: req.correlationId,
        requestId: req.requestId,
      }));
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
    errorLogger.error('Unhandled error', redactObject({
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
      correlationId: req.correlationId,
      requestId: req.requestId,
    }));

    const internal = new InternalServerError(undefined, req.correlationId);
    const body = this.buildErrorResponse(
      req,
      internal.statusCode,
      internal.code,
      internal.message,
    );
    res.status(internal.statusCode).json(body);
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

  if (isAppError(err)) {
    ErrorHandlerService.handleAppError(req, res, err);
    return;
  }

  ErrorHandlerService.handleUnknownError(req, res, err);
}
