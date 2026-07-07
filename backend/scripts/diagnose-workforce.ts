import '../src/bootstrap-env.js';
import { connectMongoDB, disconnectMongoDB } from '../src/infrastructure/database/mongodb.connection.js';
import { EmployeeRepository } from '../src/domain/employee/employee.schemas.js';
import { UserRepository } from '../src/domain/auth/user.schema.js';
import { CompanyRepository } from '../src/domain/company/company.schema.js';
import {
  BranchRepository,
  DepartmentRepository,
  DesignationRepository,
} from '../src/domain/organization/organization.schemas.js';

async function main(): Promise<void> {
  await connectMongoDB();
  const company = await CompanyRepository.findOne({});
  if (!company) {
    console.log('No company found.');
    return;
  }

  console.log(`Company: ${company.name} (${company.code})`);

  const [employees, users, departments, designations, branches] = await Promise.all([
    EmployeeRepository.findMany({}, { companyId: company.id, includeDeleted: true }),
    UserRepository.findMany({}, { companyId: company.id }),
    DepartmentRepository.findMany({}, { companyId: company.id }),
    DesignationRepository.findMany({}, { companyId: company.id }),
    BranchRepository.findMany({}, { companyId: company.id }),
  ]);

  console.log(`\nOrganization (preserved): ${departments.length} departments, ${designations.length} designations, ${branches.length} branches`);
  for (const dept of departments) {
    console.log(`  dept ${dept.code}: ${dept.name} (${dept.status})`);
  }

  console.log(`\nEmployees: ${employees.length}`);
  for (const employee of employees) {
    console.log(
      `  ${employee.employeeNumber} | ${employee.email} | ${employee.firstName} ${employee.lastName} | status=${employee.status} | deleted=${employee.isDeleted}`,
    );
  }

  console.log(`\nUsers: ${users.length}`);
  for (const user of users) {
    console.log(`  ${user.email} | employeeId=${user.employeeId ?? 'none'} | status=${user.status}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await disconnectMongoDB();
  });
