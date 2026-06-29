export interface ApiMeta {
  correlationId: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown[];
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode?: number;
  error: ApiErrorBody;
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiSuccessResponseWithPagination<T> extends ApiSuccessResponse<T> {
  pagination?: PaginationMeta;
}

export function isApiErrorResponse(response: ApiResponse<unknown>): response is ApiErrorResponse {
  return response.success === false;
}
