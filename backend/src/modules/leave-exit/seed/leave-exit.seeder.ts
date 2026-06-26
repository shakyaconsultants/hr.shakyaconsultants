import { CompanyRepository } from '@domain/company/company.schema.js';
import { registerSeeder } from '@infrastructure/database/seed/seed.registry.js';
import { databaseLogger } from '@logging/winston.logger.js';
import { LeaveExitSeederService } from '@modules/leave-exit/services/leave-exit-seeder.service.js';
import type { ApprovalActorContext } from '@modules/approval/types/approval.types.js';

const LEAVE_EXIT_SEEDER = 'leave_exit_defaults';
const SYSTEM_ACTOR = 'system';

async function resolveCompanyId(fallbackCompanyId: string): Promise<string | null> {
  if (fallbackCompanyId !== 'system') {
    return fallbackCompanyId;
  }
  const companies = await CompanyRepository.findMany({}, {});
  return companies[0]?.id ?? null;
}

function buildActor(companyId: string): ApprovalActorContext {
  return {
    companyId,
    userId: SYSTEM_ACTOR,
    employeeId: SYSTEM_ACTOR,
  };
}

registerSeeder({
  name: LEAVE_EXIT_SEEDER,
  order: 50,
  run: async ({ companyId }) => {
    const resolvedCompanyId = await resolveCompanyId(companyId);
    if (!resolvedCompanyId) {
      databaseLogger.warn('Leave-exit seeder skipped — no company found');
      return;
    }

    await LeaveExitSeederService.seedDefaults(buildActor(resolvedCompanyId));
    databaseLogger.info('Leave-exit defaults seeded', { companyId: resolvedCompanyId });
  },
});
