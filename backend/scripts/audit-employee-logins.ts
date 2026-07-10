/**
 * Verify employee portal passwords against default temp password.
 * Usage: npx tsx scripts/audit-employee-logins.ts
 */
import '../src/bootstrap-env.js';
import { connectMongoDB, disconnectMongoDB } from '../src/infrastructure/database/mongodb.connection.js';
import { CompanyRepository } from '../src/domain/company/company.schema.js';
import { EmployeeRepository } from '../src/domain/employee/employee.schemas.js';
import { UserModel } from '../src/domain/auth/user.schema.js';
import { PasswordService } from '../src/modules/auth/services/password.service.js';
import { DEFAULT_EMPLOYEE_TEMP_PASSWORD } from '../src/modules/employee/constants/employee.constants.js';
import { ENTITY_STATUS } from '../src/shared/constants/status.constants.js';

async function main(): Promise<void> {
  await connectMongoDB();
  const company = await CompanyRepository.findOne({});
  if (!company) {
    console.log('No company.');
    return;
  }

  console.log(`Company: ${company.code} (${company.name})\n`);
  const employees = await EmployeeRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, {
    companyId: company.id,
  });

  for (const employee of employees) {
    const user = employee.userId
      ? await UserModel.findOne({ id: employee.userId, companyId: company.id })
          .select('+passwordHash email status employeeId')
          .exec()
      : await UserModel.findOne({ email: employee.email.toLowerCase(), companyId: company.id })
          .select('+passwordHash email status employeeId')
          .exec();

    const defaultPwdOk = user?.passwordHash
      ? await PasswordService.comparePassword(DEFAULT_EMPLOYEE_TEMP_PASSWORD, user.passwordHash)
      : false;

    console.log(
      [
        employee.employeeNumber,
        employee.email,
        `userId=${employee.userId ?? 'NONE'}`,
        `userStatus=${user?.status ?? 'NO_USER'}`,
        `userEmail=${user?.email ?? '-'}`,
        `welcome1=${defaultPwdOk}`,
        user?.employeeId && user.employeeId !== employee.id ? `LINK_MISMATCH(user->${user.employeeId})` : '',
      ]
        .filter(Boolean)
        .join(' | '),
    );
  }

  await disconnectMongoDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
