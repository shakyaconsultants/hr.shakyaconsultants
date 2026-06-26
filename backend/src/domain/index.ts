/**
 * Domain model registration — side-effect imports register all Mongoose models.
 * Import this module once after MongoDB connection is established.
 */
import '@domain/auth/user.schema.js';
import '@domain/company/company.schema.js';
import '@domain/permission/permission.schemas.js';
import '@domain/permission/rbac.schemas.js';
import '@domain/organization/organization.schemas.js';
import '@domain/master-data/master-data.schemas.js';
import '@domain/employee/employee.schemas.js';
import '@domain/employee/employee-subresource.schemas.js';
import '@domain/recruitment/recruitment.schemas.js';
import '@domain/recruitment/recruitment-extended.schemas.js';
import '@domain/project/project.schemas.js';
import '@domain/project/project-extended.schemas.js';
import '@domain/workspace/workspace-extended.schemas.js';
import '@domain/approval/approval.schemas.js';
import '@domain/leave-exit/leave-exit.schemas.js';
import '@domain/attendance/attendance.schemas.js';
import '@domain/payroll/payroll.schemas.js';
import '@domain/sales/sales.schemas.js';
import '@domain/communication/communication.schemas.js';
import '@domain/integration/integration.schemas.js';
import '@domain/audit/audit.schemas.js';
import '@infrastructure/cache/cache-entry.schema.js';
import { mongoose } from '@infrastructure/database/mongodb.connection.js';

export function registerDomainModels(): void {
  // Models registered via side-effect imports above.
}

export async function syncDomainIndexes(): Promise<void> {
  const models = Object.values(mongoose.models);
  await Promise.all(models.map((model) => model.syncIndexes()));
}
