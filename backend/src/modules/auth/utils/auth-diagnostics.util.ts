import { logger } from '@logging/winston.logger.js';
import { getEnv } from '@config/env.js';

const ENABLED = (): boolean => getEnv().AUTH_DEBUG === true;

export type AuthServerDiagEvent =
  | 'auth_me_started'
  | 'auth_me_success'
  | 'auth_me_failed'
  | 'auth_refresh_started'
  | 'auth_refresh_success'
  | 'auth_refresh_failed'
  | 'auth_authenticate_failed'
  | 'auth_cookie_set';

interface AuthServerDiagPayload {
  [key: string]: string | number | boolean | undefined | null;
}

export const authServerDiag = {
  log(event: AuthServerDiagEvent, payload: AuthServerDiagPayload = {}): void {
    if (!ENABLED()) return;
    logger.info(`[auth-diag] ${event}`, payload);
  },
};
