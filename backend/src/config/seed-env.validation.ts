import { getEnv } from '@config/env.js';

const WEAK_SEED_PASSWORDS = ['SuperAdmin@123'] as const;

/** Call from seed scripts only — seed credentials are not required at API runtime. */
export function assertProductionSafeSeedCredentials(): void {
  const env = getEnv();
  if (env.NODE_ENV !== 'production') {
    return;
  }

  if (
    WEAK_SEED_PASSWORDS.includes(env.SEED_ADMIN_PASSWORD as (typeof WEAK_SEED_PASSWORDS)[number]) ||
    WEAK_SEED_PASSWORDS.includes(env.SUPER_ADMIN_PASSWORD as (typeof WEAK_SEED_PASSWORDS)[number])
  ) {
    throw new Error(
      'Seed credentials must not use default passwords in production. Set SEED_ADMIN_PASSWORD and SUPER_ADMIN_PASSWORD before running seed:init.',
    );
  }
}
