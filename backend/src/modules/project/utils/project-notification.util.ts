import { EmployeeRepository } from '@domain/employee/employee.schemas.js';

export async function resolveNotificationUserId(companyId: string, employeeOrUserId: string): Promise<string> {
  const employee = await EmployeeRepository.findById(employeeOrUserId, { companyId });
  if (employee?.userId) {
    return employee.userId;
  }
  return employeeOrUserId;
}
