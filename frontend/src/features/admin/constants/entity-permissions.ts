import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';

export interface EntityPermissionSet {
  read: string;
  create: string;
  update: string;
  delete: string;
}

export const ENTITY_PERMISSIONS: Record<MasterEntityKey, EntityPermissionSet> = {
  branch: {
    read: 'branch.read',
    create: 'branch.create',
    update: 'branch.update',
    delete: 'branch.delete',
  },
  department: {
    read: 'department.read',
    create: 'department.create',
    update: 'department.update',
    delete: 'department.delete',
  },
  designation: {
    read: 'designation.read',
    create: 'designation.create',
    update: 'designation.update',
    delete: 'designation.delete',
  },

  'work-shift': {
    read: 'work-shift.read',
    create: 'work-shift.create',
    update: 'work-shift.update',
    delete: 'work-shift.delete',
  },
  holiday: {
    read: 'holiday.read',
    create: 'holiday.create',
    update: 'holiday.update',
    delete: 'holiday.delete',
  },
  'employment-type': {
    read: 'employment-type.read',
    create: 'employment-type.create',
    update: 'employment-type.update',
    delete: 'employment-type.delete',
  },
  'salary-grade': {
    read: 'salary-grade.read',
    create: 'salary-grade.create',
    update: 'salary-grade.update',
    delete: 'salary-grade.delete',
  },
  'leave-type': {
    read: 'leave-type.read',
    create: 'leave-type.create',
    update: 'leave-type.update',
    delete: 'leave-type.delete',
  },
};

export const ORG_BULK_PERMISSION = 'organization.bulk';
export const ORG_EXPORT_PERMISSION = 'organization.export';
export const ORG_IMPORT_PERMISSION = 'organization.import';
export const COMPANY_READ_PERMISSION = 'company.read';
export const COMPANY_UPDATE_PERMISSION = 'company.update';

export function getEntityPermissions(entityKey: MasterEntityKey): EntityPermissionSet {
  return ENTITY_PERMISSIONS[entityKey];
}
