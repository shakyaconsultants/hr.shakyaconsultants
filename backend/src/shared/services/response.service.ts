import type { Response } from 'express';
import type { Request } from 'express';
import { HTTP_MESSAGES, HTTP_STATUS } from '@shared/constants/http.constants.js';
import type {
  ApiMeta,
  ApiSuccessResponse,
  PaginatedResult,
} from '@shared/types/api.types.js';
import { getRequestContext } from '@shared/context/request.context.js';

export const ResponseService = {
  buildMeta(req: Request): ApiMeta {
    return {
      correlationId: req.correlationId,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    };
  },

  buildMetaFromContext(): ApiMeta {
    const ctx = getRequestContext();
    return {
      correlationId: ctx?.correlationId ?? 'system',
      requestId: ctx?.requestId,
      timestamp: new Date().toISOString(),
    };
  },

  success(
    res: Response,
    req: Request,
    data: unknown,
    message: string = HTTP_MESSAGES.OK,
    statusCode: number = HTTP_STATUS.OK,
  ): Response {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      meta: this.buildMeta(req),
    } satisfies ApiSuccessResponse<unknown>);
  },

  created(res: Response, req: Request, data: unknown, message: string = HTTP_MESSAGES.CREATED): Response {
    return this.success(res, req, data, message, HTTP_STATUS.CREATED);
  },

  updated(res: Response, req: Request, data: unknown, message: string = HTTP_MESSAGES.UPDATED): Response {
    return this.success(res, req, data, message, HTTP_STATUS.OK);
  },

  deleted(res: Response, req: Request, message: string = HTTP_MESSAGES.DELETED): Response {
    return this.success(res, req, { deleted: true }, message, HTTP_STATUS.OK);
  },

  accepted(res: Response, req: Request, data: unknown, message: string = HTTP_MESSAGES.ACCEPTED): Response {
    return this.success(res, req, data, message, HTTP_STATUS.ACCEPTED);
  },

  noContent(res: Response): Response {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  },

  paginated<T>(
    res: Response,
    req: Request,
    result: PaginatedResult<T>,
    message: string = HTTP_MESSAGES.OK,
  ): Response {
    const body = {
      success: true as const,
      statusCode: HTTP_STATUS.OK,
      message,
      data: result.items,
      meta: this.buildMeta(req),
      pagination: result.pagination,
    };
    return res.status(HTTP_STATUS.OK).json(body);
  },
};

export function buildMeta(correlationId: string, requestId?: string): ApiMeta {
  return {
    correlationId,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export function sendSuccess(
  res: Response,
  data: unknown,
  statusCode: number,
  meta: ApiMeta,
): Response {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message: HTTP_MESSAGES.OK,
    data,
    meta,
  } satisfies ApiSuccessResponse<unknown>);
}

export function sendOk(res: Response, data: unknown, meta: ApiMeta): Response {
  return sendSuccess(res, data, HTTP_STATUS.OK, meta);
}

export function sendCreated(res: Response, data: unknown, meta: ApiMeta): Response {
  return sendSuccess(res, data, HTTP_STATUS.CREATED, meta);
}
