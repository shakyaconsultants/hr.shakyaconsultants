import '../src/bootstrap-env.js';
import { connectMongoDB, disconnectMongoDB } from '../src/infrastructure/database/mongodb.connection.js';
import { CompanyRepository } from '../src/domain/company/company.schema.js';
import { UserModel, USER_STATUS } from '../src/domain/auth/user.schema.js';
import { PasswordService } from '../src/modules/auth/services/password.service.js';
import { AuthUserRepository } from '../src/modules/auth/repositories/user.repository.js';
import { SystemAdminProfileService } from '../src/modules/auth/services/system-admin-profile.service.js';
import { getEnv } from '../src/config/env.js';

async function main(): Promise<void> {
  await connectMongoDB();
  const env = getEnv();
  const email = env.SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const password = env.SUPER_ADMIN_PASSWORD;

  const company = await CompanyRepository.findOne({ code: env.SEED_COMPANY_CODE ?? 'HRS' });
  if (!company) {
    console.error('No company found. Run npm run seed once if this is a fresh database.');
    process.exit(1);
  }

  let user = await UserModel.findOne({ email, companyId: company.id, isDeleted: false })
    .select('+passwordHash')
    .exec();

  if (!user) {
    console.error(`No admin user found for ${email}. Bootstrap may be incomplete.`);
    process.exit(1);
  }

  user = await SystemAdminProfileService.migrateLegacyEmployeeLinkedAdmin(company.id, user);

  const passwordHash = await PasswordService.hashPassword(password);
  await AuthUserRepository.updatePassword(user.id, company.id, passwordHash, user.id);
  await AuthUserRepository.resetFailedAttempts(user.id, company.id);

  console.log('Admin access restored.');
  console.log('Admin profile is a system user account (not listed in Employees).');
  console.log(`Company code: ${company.code}`);
  console.log(`Email: ${user.email}`);
  console.log(`Password: value from SUPER_ADMIN_PASSWORD in backend/.env`);
  console.log(`Status: active (failed attempts reset)`);

  if (user.status !== USER_STATUS.ACTIVE) {
    console.warn(`Warning: admin user status is "${user.status}"`);
  }

  await disconnectMongoDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
