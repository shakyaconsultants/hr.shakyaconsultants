import axios from 'axios';
import type { SessionRestoreFailureReason } from '@/shared/auth/session-restore.types';

function isTransientStatus(status: number | undefined): boolean {
  if (status === undefined) {
    return true;
  }
  // Auth bootstrap should land on login for server/auth failures — not a retry splash.
  if (status === 408 || status === 429 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  return false;
}

export function classifyHttpFailure(error: unknown): {
  reason: SessionRestoreFailureReason;
  status?: number;
  message: string;
  retryable: boolean;
} {
  if (error && typeof error === 'object') {
    const err = error as any;
    const status = err.status;
    if (status !== undefined) {
      if (status === 401) {
        return {
          reason: 'unauthenticated',
          status,
          message: err.error?.message ?? 'Session expired or invalid',
          retryable: false,
        };
      }
      if (status === 403) {
        return {
          reason: 'forbidden',
          status,
          message: err.error?.message ?? 'Access denied',
          retryable: false,
        };
      }
      if (status >= 500) {
        return {
          reason: 'transient',
          status,
          message: `Server error (${status})`,
          retryable: true,
        };
      }
      if (isTransientStatus(status)) {
        return {
          reason: 'transient',
          status,
          message: `Temporary failure (${status})`,
          retryable: true,
        };
      }
    }
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (!error.response) {
      const code = error.code ?? 'NETWORK_ERROR';
      return {
        reason: 'transient',
        message: code === 'ECONNABORTED' ? 'Request timed out' : 'Network unavailable',
        retryable: true,
      };
    }

    if (status === 401) {
      return {
        reason: 'unauthenticated',
        status,
        message: 'Session expired or invalid',
        retryable: false,
      };
    }

    if (status === 403) {
      return { reason: 'forbidden', status, message: 'Access denied', retryable: false };
    }

    if (status !== undefined && status >= 500) {
      return { reason: 'transient', status, message: `Server error (${status})`, retryable: true };
    }

    if (isTransientStatus(status)) {
      return {
        reason: 'transient',
        status,
        message: `Temporary failure (${status})`,
        retryable: true,
      };
    }
  }

  return {
    reason: 'transient',
    message: 'Unexpected error during session restore',
    retryable: true,
  };
}

/** Session restore: expired/invalid auth → login; only true outages stay retryable. */
export function classifySessionRestoreFailure(error: unknown): {
  reason: SessionRestoreFailureReason;
  status?: number;
  message: string;
  retryable: boolean;
} {
  const failure = classifyHttpFailure(error);

  if (failure.reason === 'unauthenticated' || failure.reason === 'forbidden') {
    return failure;
  }

  if (failure.reason === 'transient') {
    const status = failure.status;
    if (
      status !== undefined &&
      status >= 500 &&
      status !== 502 &&
      status !== 503 &&
      status !== 504
    ) {
      return {
        reason: 'unauthenticated',
        status,
        message: 'Session expired or invalid',
        retryable: false,
      };
    }
    if (status === 404) {
      return {
        reason: 'unauthenticated',
        status,
        message: 'Session expired or invalid',
        retryable: false,
      };
    }
  }

  return failure;
}

export function isRetryableFailure(reason: SessionRestoreFailureReason): boolean {
  return reason === 'transient';
}
