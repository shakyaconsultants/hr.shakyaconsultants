import '../src/bootstrap-env.js';
import { connectMongoDB, disconnectMongoDB } from '../src/infrastructure/database/mongodb.connection.js';
import { CompanyRepository } from '../src/domain/company/company.schema.js';
import { UserModel, USER_STATUS } from '../src/domain/auth/user.schema.js';
import { PasswordService } from '../src/modules/auth/services/password.service.js';
import { AuthService } from '../src/modules/auth/services/auth.service.js';
import { getEnv } from '../src/config/env.js';

async function main(): Promise<void> {
  await connectMongoDB();
  const env = getEnv();

  const companies = await CompanyRepository.findMany({}, {});
  console.log('\n=== Companies ===');
  for (const company of companies) {
    console.log(`- ${company.code} | ${company.name} | id=${company.id}`);
  }

  console.log('\n=== Users ===');
  const users = await UserModel.find({ isDeleted: false }).select('+passwordHash').limit(20).exec();
  for (const user of users) {
    const company = companies.find((c) => c.id === user.companyId);
    console.log(
      `- ${user.email} | company=${company?.code ?? user.companyId} | status=${user.status} | lockedUntil=${user.lockedUntil?.toISOString() ?? 'null'} | failed=${user.failedLoginAttempts}`,
    );
  }

  const testEmail = env.SUPER_ADMIN_EMAIL.toLowerCase();
  const testPassword = env.SUPER_ADMIN_PASSWORD;
  const company = companies[0];
  if (company) {
    const user = await UserModel.findOne({
      email: testEmail,
      companyId: company.id,
      isDeleted: false,
    })
      .select('+passwordHash')
      .exec();

    console.log('\n=== Credential check (from .env SUPER_ADMIN_*) ===');
    console.log(`Email: ${testEmail}`);
    console.log(`Company: ${company.code}`);
    if (!user) {
      console.log('Result: USER NOT FOUND for this email + company');
    } else {
      const valid = await PasswordService.comparePassword(testPassword, user.passwordHash);
      console.log(`User status: ${user.status}`);
      console.log(`Password matches .env SUPER_ADMIN_PASSWORD: ${valid}`);

      if (valid && user.status === USER_STATUS.ACTIVE) {
        try {
          const login = await AuthService.login(
            { companyCode: company.code, email: testEmail, password: testPassword, rememberMe: false },
            { ipAddress: '127.0.0.1', userAgent: 'diagnose-auth', correlationId: 'diag' },
          );
          console.log(`AuthService.login: SUCCESS sessionId=${login.sessionId} profile=${login.profile ? 'yes' : 'no'}`);
        } catch (error) {
          console.log(`AuthService.login: FAILED ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  await disconnectMongoDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
