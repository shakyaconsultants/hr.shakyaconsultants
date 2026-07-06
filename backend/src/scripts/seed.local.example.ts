/**
 * Local system initialization — NOT committed to git.
 *
 * Setup:
 *   1. Copy this file to seed.local.ts (same folder)
 *   2. Set SUPER_ADMIN_* and SEED_COMPANY_* in backend/.env
 *   3. Run: npm run seed:init
 *   4. Then run: npm run seed  (RBAC, master data, leave defaults)
 */
import { connectMongoDB, disconnectMongoDB } from '@infrastructure/database/mongodb.connection.js';
import { registerDomainModels } from '@domain/index.js';
import { getEnv } from '@config/env.js';
import { assertProductionSafeSeedCredentials } from '@config/seed-env.validation.js';
import { CompanyRepository } from '@domain/company/company.schema.js';
import {
  BranchRepository,
  DepartmentRepository,
  DesignationRepository,
} from '@domain/organization/organization.schemas.js';
import { RoleRepository } from '@domain/permission/permission.schemas.js';
import { UserRepository, USER_STATUS } from '@domain/auth/user.schema.js';
import { BOOTSTRAP_ORG_DEFAULTS } from '@modules/auth/constants/role-seed.constants.js';
import { parseSuperAdminFromEnv } from '@modules/auth/utils/super-admin-env.util.js';
import { seedRbac } from '@modules/rbac/seed/rbac.seeder.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { PasswordService } from '@modules/auth/services/password.service.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { logger } from '@logging/winston.logger.js';

const SYSTEM_ACTOR = 'system';

async function main(): Promise<void> {
  assertProductionSafeSeedCredentials();
  await connectMongoDB();
  registerDomainModels();

  const existingCompanies = await CompanyRepository.count({});
  if (existingCompanies > 0) {
    logger.info('System already initialized — nothing to do');
    await disconnectMongoDB();
    return;
  }

  const env = getEnv();
  const admin = parseSuperAdminFromEnv();
  const companyId = generateUuid();
  const branchId = generateUuid();
  const departmentId = generateUuid();
  const designationId = generateUuid();

  logger.info('Creating company and org structure', { companyCode: env.SEED_COMPANY_CODE });

  await CompanyRepository.create({
    id: companyId,
    companyId,
    name: env.SEED_COMPANY_NAME,
    legalName: env.SEED_COMPANY_LEGAL_NAME,
    slug: env.SEED_COMPANY_CODE.toLowerCase(),
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
    status: ENTITY_STATUS.ACTIVE,
    settings: {},
    createdBy: SYSTEM_ACTOR,
    updatedBy: SYSTEM_ACTOR,
  });

  await BranchRepository.create(
    {
      id: branchId,
      companyId,
      name: BOOTSTRAP_ORG_DEFAULTS.BRANCH_NAME,
      code: BOOTSTRAP_ORG_DEFAULTS.BRANCH_CODE,
      phone: env.SEED_COMPANY_PHONE,
      email: env.SEED_COMPANY_EMAIL,
      address: {
        line1: env.SEED_COMPANY_ADDRESS_LINE1,
        city: env.SEED_COMPANY_CITY,
        state: env.SEED_COMPANY_STATE,
        country: env.SEED_COMPANY_COUNTRY,
        postalCode: env.SEED_COMPANY_POSTAL_CODE,
      },
      status: ENTITY_STATUS.ACTIVE,
      createdBy: SYSTEM_ACTOR,
      updatedBy: SYSTEM_ACTOR,
    },
    { companyId },
  );

  await DepartmentRepository.create(
    {
      id: departmentId,
      companyId,
      name: BOOTSTRAP_ORG_DEFAULTS.DEPARTMENT_NAME,
      code: BOOTSTRAP_ORG_DEFAULTS.DEPARTMENT_CODE,
      status: ENTITY_STATUS.ACTIVE,
      createdBy: SYSTEM_ACTOR,
      updatedBy: SYSTEM_ACTOR,
    },
    { companyId },
  );

  await DesignationRepository.create(
    {
      id: designationId,
      companyId,
      name: BOOTSTRAP_ORG_DEFAULTS.DESIGNATION_NAME,
      code: BOOTSTRAP_ORG_DEFAULTS.DESIGNATION_CODE,
      status: ENTITY_STATUS.ACTIVE,
      createdBy: SYSTEM_ACTOR,
      updatedBy: SYSTEM_ACTOR,
    },
    { companyId },
  );

  logger.info('Seeding RBAC catalog');
  await seedRbac(companyId);

  const superAdminRole = await RoleRepository.findOne(
    { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
    { companyId },
  );
  if (!superAdminRole) {
    throw new Error('Super Admin role not found after RBAC seed');
  }

  const passwordHash = await PasswordService.hashPassword(admin.password);
  const adminUserId = generateUuid();
  await UserRepository.create(
    {
      id: adminUserId,
      companyId,
      email: admin.email,
      passwordHash,
      roleIds: [superAdminRole.id],
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      passwordChangedAt: new Date(),
      mustChangePassword: false,
      status: USER_STATUS.ACTIVE,
      createdBy: SYSTEM_ACTOR,
      updatedBy: SYSTEM_ACTOR,
    },
    { companyId },
  );

  logger.info('Local init complete', {
    companyCode: env.SEED_COMPANY_CODE,
    adminEmail: admin.email,
    nextStep: 'Run npm run seed for master data and leave defaults',
  });

  await disconnectMongoDB();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown init error';
  logger.error('Local seed failed', { error: message });
  process.exitCode = 1;
});
