import '../src/bootstrap-env.js';
import { connectMongoDB, disconnectMongoDB } from '../src/infrastructure/database/mongodb.connection.js';
import { CompanyRepository } from '../src/domain/company/company.schema.js';
import { EmployeeRepository } from '../src/domain/employee/employee.schemas.js';
import { UserRepository } from '../src/domain/auth/user.schema.js';
import { RoleRepository } from '../src/domain/permission/permission.schemas.js';
import { SYSTEM_ROLE_SLUG } from '../src/modules/rbac/constants/rbac.constants.js';
import { ENTITY_STATUS } from '../src/shared/constants/status.constants.js';

const emailArg = process.argv[2]?.trim().toLowerCase();
if (!emailArg) {
  console.error('Usage: tsx scripts/check-email.ts <email>');
  process.exit(1);
}

async function main(): Promise<void> {
  await connectMongoDB();
  const company = await CompanyRepository.findOne({});
  if (!company) {
    console.log('No company.');
    return;
  }

  const email = emailArg;
  console.log(`Checking "${email}" for company ${company.code}\n`);

  const employees = await EmployeeRepository.findMany({ email }, {
    companyId: company.id,
    includeDeleted: true,
  });
  console.log(`Employee rows with this email: ${employees.length}`);
  for (const employee of employees) {
    console.log(
      `  ${employee.employeeNumber} | ${employee.firstName} ${employee.lastName} | status=${employee.status} | deleted=${employee.isDeleted} | id=${employee.id}`,
    );
  }

  const user = await UserRepository.findOne({ email }, { companyId: company.id });
  if (!user) {
    console.log('\nPortal user: none');
  } else {
    const superAdminRole = await RoleRepository.findOne(
      { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
      { companyId: company.id },
    );
    const isSuperAdmin = Boolean(
      superAdminRole && user.roleIds.includes(superAdminRole.id) && !user.employeeId,
    );
    console.log(`\nPortal user: ${user.email}`);
    console.log(`  employeeId=${user.employeeId ?? 'none'} | status=${user.status}`);
    console.log(`  isSuperAdmin=${isSuperAdmin}`);
    console.log(`  roleIds=${user.roleIds.join(', ') || 'none'}`);

    if (user.employeeId) {
      const linked = await EmployeeRepository.findById(user.employeeId, {
        companyId: company.id,
        includeDeleted: true,
      });
      console.log(
        linked
          ? `  linked employee: ${linked.employeeNumber} | ${linked.email} | status=${linked.status} | deleted=${linked.isDeleted}`
          : '  linked employee: MISSING (orphan user link)',
      );
    }
  }

  const activeBlocker = employees.find(
    (employee) => employee.status === ENTITY_STATUS.ACTIVE && !employee.isDeleted,
  );
  if (activeBlocker) {
    console.log('\n→ Would return 409: active employee already uses this email.');
  } else if (user && !user.employeeId) {
    const superAdminRole = await RoleRepository.findOne(
      { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
      { companyId: company.id },
    );
    const isSuperAdmin = Boolean(superAdminRole && user.roleIds.includes(superAdminRole.id));
    if (isSuperAdmin) {
      console.log('\n→ Would return 409: email is reserved for company administrator login.');
    } else {
      console.log('\n→ Would succeed: existing portal user would be linked to new employee.');
    }
  } else if (!user && !activeBlocker) {
    console.log('\n→ Would succeed: email is available.');
  }

  await disconnectMongoDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
