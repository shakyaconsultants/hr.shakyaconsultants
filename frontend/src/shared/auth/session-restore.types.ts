import type { MeResult } from '@/features/auth/api/auth.api';

export type SessionRestoreFailureReason =
  | 'no_session_hint'
  | 'unauthenticated'
  | 'forbidden'
  | 'transient';

export type SessionRestoreOutcome =
  | { ok: true; me: MeResult }
  | { ok: false; reason: SessionRestoreFailureReason; status?: number; message?: string };

export interface BootstrapResult {
  success: boolean;
  reason?: SessionRestoreFailureReason;
  status?: number;
  message?: string;
  report: {
    totalMs: number;
    targetMs: number;
    withinTarget: boolean;
    operations: Array<{ operation: string; elapsedMs: number; deltaMs: number }>;
  };
}
