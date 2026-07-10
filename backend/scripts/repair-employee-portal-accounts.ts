/**
 * Backfill portal login accounts for active employees missing userId.
 * Usage: npx tsx scripts/repair-employee-portal-accounts.ts
 */
import '../src/bootstrap-env.js';
import { connectMongoDB, disconnectMongoDB } from '../src/infrastructure/database/mongodb.connection.js';
import { CompanyRepository } from '../src/domain/company/company.schema.js';
import { EmployeeRepository } from '../src/domain/employee/employee.schemas.js';
import { EmployeeAccountService } from '../src/modules/employee/services/employee-account.service.js';
import { ENTITY_STATUS } from '../src/shared/constants/status.constants.js';
import { DEFAULT_EMPLOYEE_TEMP_PASSWORD } from '../src/modules/employee/constants/employee.constants.js';

const REPAIR_ACTOR = 'repair-employee-portal-accounts';

async function main(): Promise<void> {
  await connectMongoDB();
  const company = await CompanyRepository.findOne({});
  if (!company) {
    console.log('No company found.');
    return;
  }

  const employees = await EmployeeRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, {
    companyId: company.id,
  });

  let repaired = 0;
  let skipped = 0;
  let failed = 0;

  for (const employee of employees) {
    if (employee.userId || employee.isDeleted || !employee.email.trim()) {
      skipped++;
      continue;
    }

    try {
      await EmployeeAccountService.ensurePortalAccountForEmployee({
        companyId: company.id,
        actorUserId: REPAIR_ACTOR,
        employeeId: employee.id,
      });
      repaired++;
      console.log(`Repaired ${employee.employeeNumber} ${employee.email}`);
    } catch (error) {
      failed++;
      console.error(
        `Failed ${employee.employeeNumber} ${employee.email}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.log(
    `\nDone. Repaired=${repaired}, skipped=${skipped}, failed=${failed}. Default password: ${DEFAULT_EMPLOYEE_TEMP_PASSWORD}`,
  );
  await disconnectMongoDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
