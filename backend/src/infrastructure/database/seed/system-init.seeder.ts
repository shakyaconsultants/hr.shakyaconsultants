import { getEnv } from '@config/env.js';
import { BootstrapService } from '@modules/auth/services/bootstrap.service.js';
import { SystemInitService } from '@modules/auth/services/system-init.service.js';
import { logger } from '@logging/winston.logger.js';

/**
 * One-time terminal seed (`npm run seed`).
 * Idempotent: skips when a company already exists (e.g. admin already seeded).
 */
export async function seedSystemFromEnv(): Promise<void> {
  const initialized = await SystemInitService.isSystemInitialized();
  if (initialized) {
    logger.info('System already initialized — seed skipped (existing admin/company preserved)');
    return;
  }

  const env = getEnv();
  logger.info('Running one-time system seed from environment...');

  const result = await BootstrapService.bootstrapSystem({
    company: {
      name: env.SEED_COMPANY_NAME,
      legalName: env.SEED_COMPANY_LEGAL_NAME,
      code: env.SEED_COMPANY_CODE,
      email: env.SEED_COMPANY_EMAIL,
      phone: env.SEED_COMPANY_PHONE,
      address: {
        line1: env.SEED_COMPANY_ADDRESS_LINE1,
        city: env.SEED_COMPANY_CITY,
        state: env.SEED_COMPANY_STATE,
        country: env.SEED_COMPANY_COUNTRY,
        postalCode: env.SEED_COMPANY_POSTAL_CODE,
      },
      timezone: env.SEED_COMPANY_TIMEZONE,
      currency: env.SEED_COMPANY_CURRENCY,
      fiscalYearStart: env.SEED_COMPANY_FISCAL_YEAR_START,
    },
    admin: {
      firstName: env.SEED_ADMIN_FIRST_NAME,
      lastName: env.SEED_ADMIN_LAST_NAME,
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      phone: env.SEED_ADMIN_PHONE || undefined,
    },
  });

  logger.info('System seed complete', {
    companyCode: result.companyCode,
    adminEmail: env.SEED_ADMIN_EMAIL,
    companyId: result.companyId,
  });
}
