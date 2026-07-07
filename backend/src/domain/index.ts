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
import { logger } from '@logging/winston.logger.js';

export function registerDomainModels(): void {
  // Models registered via side-effect imports above.
}

export async function syncDomainIndexes(): Promise<void> {
  await repairEmployeeUniqueIndexes();
  await syncCollectionIndexes('ProjectDraft', 'project_drafts');
}

async function syncCollectionIndexes(modelName: string, label: string): Promise<void> {
  if (!mongoose.modelNames().includes(modelName)) {
    return;
  }

  const Model = mongoose.models[modelName];

  try {
    await Model.syncIndexes();
    logger.info('Index sync completed', { collection: label });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('Index sync warning', { collection: label, message });
  }
}

async function repairEmployeeUniqueIndexes(): Promise<void> {
  if (!mongoose.modelNames().includes('Employee')) {
    return;
  }

  const Employee = mongoose.models.Employee;

  await Employee.updateMany(
    { $or: [{ aadhaarNumber: null }, { aadhaarNumber: '' }] },
    { $unset: { aadhaarNumber: '' } },
  );
  await Employee.updateMany(
    { $or: [{ panNumber: null }, { panNumber: '' }] },
    { $unset: { panNumber: '' } },
  );

  const collection = Employee.collection;
  for (const indexName of ['uq_employees_company_aadhaar', 'uq_employees_company_pan']) {
    try {
      await collection.dropIndex(indexName);
    } catch {
      // Index may not exist or already matches schema.
    }
  }

  try {
    await Employee.syncIndexes();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('Employee index sync warning', { message });
  }
}
