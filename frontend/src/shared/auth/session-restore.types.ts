import type { MeResult } from '@/features/auth/api/auth.api';

export type SessionRestoreFailureReason =
  | 'no_session_hint'
  | 'unauthenticated'
  | 'forbidden'
  | 'transient';

export type SessionRestoreOutcome =
  | { ok: true; me: MeResult }
  | { ok: false; reason: SessionRestoreFailureReason; status?: number; message?: string };
