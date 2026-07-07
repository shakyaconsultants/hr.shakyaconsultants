import '../src/bootstrap-env.js';
import { connectMongoDB, disconnectMongoDB } from '../src/infrastructure/database/mongodb.connection.js';
import { CompanyRepository } from '../src/domain/company/company.schema.js';
import { SystemAdminProfileService } from '../src/modules/auth/services/system-admin-profile.service.js';
import { UserModel } from '../src/domain/auth/user.schema.js';
import { WorkforceCleanupService } from '../src/modules/employee/services/workforce-cleanup.service.js';
import { getEnv } from '../src/config/env.js';
import {
  BranchRepository,
  DepartmentRepository,
  DesignationRepository,
} from '../src/domain/organization/organization.schemas.js';

async function main(): Promise<void> {
  await connectMongoDB();
  const env = getEnv();

  const company = await CompanyRepository.findOne({ code: env.SEED_COMPANY_CODE ?? 'HRS' });
  if (company) {
    const adminUser = await UserModel.findOne({
      email: env.SUPER_ADMIN_EMAIL.trim().toLowerCase(),
      companyId: company.id,
      isDeleted: false,
    }).exec();
    if (adminUser) {
      await SystemAdminProfileService.migrateLegacyEmployeeLinkedAdmin(company.id, adminUser);
    }
  }

  const result = await WorkforceCleanupService.runForAllCompanies();

  const sampleCompany = company ?? (await CompanyRepository.findOne({}));
  if (sampleCompany) {
    const [departments, designations, branches] = await Promise.all([
      DepartmentRepository.findMany({}, { companyId: sampleCompany.id }),
      DesignationRepository.findMany({}, { companyId: sampleCompany.id }),
      BranchRepository.findMany({}, { companyId: sampleCompany.id }),
    ]);
    console.log(
      `Organization master data preserved: ${departments.length} departments, ${designations.length} designations, ${branches.length} branches.`,
    );
  }

  console.log(`Workforce cleanup across ${result.companies} company/companies:`);
  console.log(`  legacy system employee rows removed: ${result.legacySystemEmployeesPurged}`);
  console.log(`  orphaned portal users cleaned: ${result.orphanedUsersCleaned}`);
  console.log('Super admin remains in users collection only. Organization setup was not modified.');

  await disconnectMongoDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
