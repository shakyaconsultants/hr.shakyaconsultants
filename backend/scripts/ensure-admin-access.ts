import '../src/bootstrap-env.js';
import { connectMongoDB, disconnectMongoDB } from '../src/infrastructure/database/mongodb.connection.js';
import { CompanyRepository } from '../src/domain/company/company.schema.js';
import { UserModel, USER_STATUS } from '../src/domain/auth/user.schema.js';
import { EmployeeRoleRepository, RoleRepository } from '../src/domain/permission/permission.schemas.js';
import { PasswordService } from '../src/modules/auth/services/password.service.js';
import { AuthUserRepository } from '../src/modules/auth/repositories/user.repository.js';
import { SYSTEM_ROLE_SLUG } from '../src/modules/rbac/constants/rbac.constants.js';
import { getEnv } from '../src/config/env.js';

async function main(): Promise<void> {
  await connectMongoDB();
  const env = getEnv();
  const email = env.SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const password = env.SUPER_ADMIN_PASSWORD;

  const company = await CompanyRepository.findOne({ code: env.SEED_COMPANY_CODE ?? 'HRS' });
  if (!company) {
    console.error('No company found. Run bootstrap first.');
    process.exit(1);
  }

  let user = await UserModel.findOne({ email, companyId: company.id, isDeleted: false })
    .select('+passwordHash')
    .exec();

  if (!user) {
    const superAdminRole = await RoleRepository.findOne(
      { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
      { companyId: company.id },
    );
    if (superAdminRole) {
      const assignment = await EmployeeRoleRepository.findMany(
        { roleId: superAdminRole.id, effectiveTo: null },
        { companyId: company.id },
      );
      for (const entry of assignment) {
        const candidate = await UserModel.findOne({
          employeeId: entry.employeeId,
          companyId: company.id,
          isDeleted: false,
        })
          .select('+passwordHash')
          .exec();
        if (candidate?.status === USER_STATUS.ACTIVE) {
          user = candidate;
          break;
        }
      }
    }
  }

  if (!user) {
    console.error(`No active admin user found for ${email}. Bootstrap may be incomplete.`);
    process.exit(1);
  }

  const passwordHash = await PasswordService.hashPassword(password);
  await AuthUserRepository.updatePassword(user.id, company.id, passwordHash, user.id);
  await AuthUserRepository.resetFailedAttempts(user.id, company.id);

  console.log('Admin access restored.');
  console.log(`Company code: ${company.code}`);
  console.log(`Email: ${user.email}`);
  console.log(`Password: value from SUPER_ADMIN_PASSWORD in backend/.env`);
  console.log(`Status: active (failed attempts reset)`);

  await disconnectMongoDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
