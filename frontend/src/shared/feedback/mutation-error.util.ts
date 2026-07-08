import type { ApiErrorResponse } from '@/shared/types/api.types';
import axios from 'axios';
import { toUserFacingErrorMessage } from '@/shared/utils/user-facing-error.util';

export interface DependencyBlocker {
  label: string;
  count: number;
  message?: string;
}

export interface ParsedMutationError {
  statusCode: number;
  code: string;
  message: string;
  title: string;
  description?: string;
  validationMessages: string[];
  dependencies: DependencyBlocker[];
  isConflict: boolean;
  isValidation: boolean;
  isForbidden: boolean;
  isNotFound: boolean;
  isServerError: boolean;
  preferInline: boolean;
  conflictEmployeeId?: string;
  conflictReason?: string;
  raw: unknown;
}

const SERVER_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const FORBIDDEN_MESSAGE = 'You do not have permission.';
const NOT_FOUND_MESSAGE = 'This record no longer exists.';

function isApiErrorShape(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as ApiErrorResponse).success === false &&
    'error' in value
  );
}

function extractValidationMessages(details: unknown[]): string[] {
  return details
    .map((detail) => {
      if (typeof detail === 'string') {
        return detail;
      }
      if (detail && typeof detail === 'object') {
        const record = detail as Record<string, unknown>;
        const path =
          typeof record.path === 'string'
            ? record.path
            : Array.isArray(record.path)
              ? record.path.join('.')
              : '';
        const message = typeof record.message === 'string' ? record.message : '';
        if (path && message) {
          return `${path}: ${message}`;
        }
        return message || null;
      }
      return null;
    })
    .filter((message): message is string => Boolean(message));
}

function extractDependencies(metadata: Record<string, unknown> | undefined): DependencyBlocker[] {
  if (!metadata) {
    return [];
  }

  const raw = metadata.dependencies;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry): DependencyBlocker | null => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const label = typeof record.label === 'string' ? record.label : '';
      const count = typeof record.count === 'number' ? record.count : 0;
      if (!label || count <= 0) {
        return null;
      }
      return {
        label,
        count,
        message: typeof record.message === 'string' ? record.message : undefined,
      };
    })
    .filter((entry): entry is DependencyBlocker => entry !== null);
}

function formatDependencyDescription(dependencies: DependencyBlocker[]): string | undefined {
  if (dependencies.length === 0) {
    return undefined;
  }

  const lines = dependencies.map((dep) => `${dep.count} ${dep.label}`);
  return `${lines.join('\n')}\n\nMove or archive them first.`;
}

function resolveStatusCode(error: unknown, apiError?: ApiErrorResponse): number {
  if (apiError?.statusCode && typeof apiError.statusCode === 'number') {
    return apiError.statusCode;
  }
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const status = (error as { statusCode?: unknown }).statusCode;
    if (typeof status === 'number') {
      return status;
    }
  }
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response;
    if (typeof response?.status === 'number') {
      return response.status;
    }
  }
  return 0;
}

export function parseMutationError(error: unknown): ParsedMutationError {
  let apiError: ApiErrorResponse | undefined;
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as any).response?.data;
    if (isApiErrorShape(data)) {
      apiError = data;
    }
  } else if (isApiErrorShape(error)) {
    apiError = error;
  }

  const statusCode = resolveStatusCode(error, apiError);
  const code = apiError?.error?.code ?? 'UNKNOWN';
  const backendMessageRaw = apiError?.error?.message?.trim() ?? '';
  const backendMessage = toUserFacingErrorMessage(backendMessageRaw || error);
  const validationMessages = extractValidationMessages(apiError?.error?.details ?? []);
  const metadata = apiError?.error?.metadata;
  const dependencies = extractDependencies(metadata);
  const conflictEmployeeId =
    typeof metadata?.employeeId === 'string' ? metadata.employeeId : undefined;
  const conflictReason = typeof metadata?.reason === 'string' ? metadata.reason : undefined;

  const isValidation = statusCode === 400 || statusCode === 422;
  const isForbidden = statusCode === 403;
  const isNotFound = statusCode === 404;
  const isConflict = statusCode === 409;
  const isServerError = statusCode >= 500 || statusCode === 0;

  let title = backendMessage;
  let description: string | undefined;
  let preferInline = isValidation;

  if (isForbidden) {
    title = FORBIDDEN_MESSAGE;
    description =
      backendMessage && backendMessage !== FORBIDDEN_MESSAGE ? backendMessage : undefined;
    preferInline = false;
  } else if (isNotFound) {
    title = NOT_FOUND_MESSAGE;
    description =
      backendMessage && backendMessage !== NOT_FOUND_MESSAGE ? backendMessage : undefined;
    preferInline = false;
  } else if (statusCode === 401) {
    title = backendMessage || 'Invalid email, password, or company code.';
    preferInline = true;
  } else if (statusCode === 429) {
    const loginLimited = /login attempt/i.test(backendMessageRaw);
    title = loginLimited ? 'Too many login attempts' : 'Too many requests';
    description =
      backendMessageRaw ||
      (loginLimited
        ? 'Please wait a few minutes before trying again.'
        : 'Please wait a moment before trying again.');
    preferInline = loginLimited;
  } else if (statusCode === 0 && axios.isAxiosError(error)) {
    preferInline = false;
    if (error.code === 'ECONNABORTED') {
      title = 'Request timed out';
      description =
        'The server took too long to respond. On hosted environments the first request after idle can be slow — please try again.';
    } else if (!error.response) {
      title = 'Unable to reach the server';
      description =
        'Check your connection. The API may be restarting — wait a few seconds and try again.';
    } else {
      title = SERVER_ERROR_MESSAGE;
    }
  } else if (isServerError) {
    title = SERVER_ERROR_MESSAGE;
    const detailFromDetails =
      apiError?.error?.details?.find((entry): entry is { message?: string } =>
        Boolean(
          entry &&
          typeof entry === 'object' &&
          typeof (entry as { message?: string }).message === 'string',
        ),
      )?.message ?? '';
    description =
      import.meta.env.DEV && (backendMessageRaw || detailFromDetails)
        ? toUserFacingErrorMessage(backendMessageRaw || detailFromDetails)
        : undefined;
    preferInline = false;
  } else if (isValidation) {
    title = validationMessages[0] ?? backendMessage ?? 'Validation failed';
    description =
      validationMessages.length > 1 ? validationMessages.slice(1).join('\n') : undefined;
  } else if (isConflict) {
    const conflictField = typeof metadata?.field === 'string' ? metadata.field : undefined;
    const conflictValue = metadata?.value;
    title = backendMessage || 'This action conflicts with existing data';
    if (!backendMessage && conflictField) {
      const label = conflictField.charAt(0).toUpperCase() + conflictField.slice(1);
      title =
        conflictValue !== undefined && conflictValue !== null
          ? `${label} "${String(conflictValue)}" is already in use`
          : `${label} is already in use`;
    }
    description = formatDependencyDescription(dependencies);
    preferInline = isValidation || isConflict;
  } else if (!title) {
    title = toUserFacingErrorMessage(error);
  }

  return {
    statusCode,
    code,
    message: title,
    title,
    description,
    validationMessages,
    dependencies,
    isConflict,
    isValidation,
    isForbidden,
    isNotFound,
    isServerError,
    preferInline,
    conflictEmployeeId,
    conflictReason,
    raw: error,
  };
}

export function formatConflictDialogBody(
  parsed: ParsedMutationError,
  entityLabel?: string,
): string {
  const header = entityLabel ? `Cannot delete ${entityLabel}.` : parsed.title;

  if (parsed.dependencies.length === 0) {
    return parsed.description ? `${header}\n\n${parsed.description}` : header;
  }

  const lines = parsed.dependencies.map((dep) => `• ${dep.count} ${dep.label}`);
  return `${header}\n\n${lines.join('\n')}\n\nMove or archive them first.`;
}
