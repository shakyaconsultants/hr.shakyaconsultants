import type { MeResult } from '@/features/auth/api/auth.api';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/config/module-registry';
import type { PortalType } from '@/config/portals';
import { authDiag } from '@/shared/auth/auth-diagnostics';
import { restoreSession } from '@/shared/auth/auth-session';
import { BootstrapProfiler } from '@/shared/auth/bootstrap-profiler';
import type { BootstrapResult } from '@/shared/auth/session-restore.types';
import { markSessionHint } from '@/shared/auth/token-storage';
import { useAuthStore } from '@/shared/stores/app.store';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';

function applySessionFromMe(me: MeResult): void {
  useAuthStore.getState().setSession({
    user: me.user,
    company: me.company,
    employee: me.employee ?? null,
    permissions: me.permissions,
    roles: me.roles,
    portal: me.portal as PortalType,
    homeRoute: me.homeRoute,
    navigation: me.navigation.items,
    featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...me.featureFlags } as FeatureFlags,
    sessionId: me.sessionId,
  });
  markSessionHint();
}

/**
 * Session restore on app load — single network call: GET /auth/me.
 */
export async function runAuthBootstrap(): Promise<BootstrapResult> {
  const profiler = new BootstrapProfiler();
  authDiag.log('session_restore_started');
  profiler.mark('session_restore_start');

  if (useAuthStore.getState().authStatus === AUTH_STATUS.AUTHENTICATED) {
    profiler.mark('session_restore_complete');
    return { success: true, report: profiler.report() };
  }

  profiler.mark('session_restore_start');
  const outcome = await restoreSession();
  profiler.mark('fetch_me_complete');

  if (!outcome.ok) {
    profiler.mark(outcome.reason === 'transient' ? 'transient_failure' : 'session_invalid');
    if (outcome.reason === 'transient') {
      authDiag.log('bootstrap_transient_error', {
        message: outcome.message,
        status: outcome.status,
      });
    }
    return {
      success: false,
      reason: outcome.reason,
      status: outcome.status,
      message: outcome.message,
      report: profiler.report(),
    };
  }

  profiler.mark('apply_session');
  applySessionFromMe(outcome.me);
  profiler.mark('session_restore_complete');
  return { success: true, report: profiler.report() };
}

/** Post-login session apply. */
export function applyLoginSession(me: MeResult): void {
  applySessionFromMe(me);
}
