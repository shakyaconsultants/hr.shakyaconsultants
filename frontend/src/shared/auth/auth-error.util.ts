import axios from 'axios';
import type { SessionRestoreFailureReason } from '@/shared/auth/session-restore.types';

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
        return { reason: 'unauthenticated', status, message: err.error?.message ?? 'Session expired or invalid', retryable: false };
      }
      if (status === 403) {
        return { reason: 'forbidden', status, message: err.error?.message ?? 'Access denied', retryable: false };
      }
      if (status >= 500) {
        return { reason: 'transient', status, message: `Server error (${status})`, retryable: true };
      }
      if (status === 408 || status === 429) {
        return { reason: 'transient', status, message: `Temporary failure (${status})`, retryable: true };
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
      return { reason: 'unauthenticated', status, message: 'Session expired or invalid', retryable: false };
    }

    if (status === 403) {
      return { reason: 'forbidden', status, message: 'Access denied', retryable: false };
    }

    if (status !== undefined && status >= 500) {
      return { reason: 'transient', status, message: `Server error (${status})`, retryable: true };
    }

    if (status === 408 || status === 429) {
      return { reason: 'transient', status, message: `Temporary failure (${status})`, retryable: true };
    }
  }

  return { reason: 'transient', message: 'Unexpected error during session restore', retryable: true };
}

export function isRetryableFailure(reason: SessionRestoreFailureReason): boolean {
  return reason === 'transient';
}
