import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export interface PermissionDocument extends BaseDocument {
  code: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  category?: string;
  permissionGroupId?: string;
  dependsOn: string[];
  metadata: Record<string, unknown>;
  isSystem: boolean;
  sortOrder: number;
  status: string;
}

export interface RoleDocument extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  status: string;
  isSystem: boolean;
  isArchived: boolean;
  priority: number;
  roleGroupId?: string;
  templateSourceId?: string;
  defaultPermissionCodes: string[];
}

export interface RolePermissionDocument extends BaseDocument {
  roleId: string;
  permissionId: string;
}

export interface EmployeeRoleDocument extends BaseDocument {
  employeeId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  isPrimary: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
}

export interface PermissionGroupDocument extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  module: string;
  status: string;
}

const permissionFields: SchemaDefinition = {
  code: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  module: { type: String, required: true, trim: true, index: true },
  action: { type: String, required: true, trim: true },
  category: { type: String, trim: true, index: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
  permissionGroupId: { type: String, index: true },
  dependsOn: { type: [String], default: [] },
  metadata: { type: Schema.Types.Mixed, default: {} },
  isSystem: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
};

const roleFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
  isSystem: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  priority: { type: Number, default: 100, min: 0 },
  roleGroupId: { type: String, index: true },
  templateSourceId: { type: String, index: true },
  defaultPermissionCodes: { type: [String], default: [] },
};

const rolePermissionFields: SchemaDefinition = {
  roleId: { type: String, required: true, index: true },
  permissionId: { type: String, required: true, index: true },
};

const employeeRoleFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  roleId: { type: String, required: true, index: true },
  assignedBy: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now },
  isPrimary: { type: Boolean, default: false },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date, default: null },
};

const permissionGroupFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, trim: true },
  module: { type: String, required: true, trim: true, index: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

export const permissionModel = defineDomainModel<PermissionDocument>(
  'Permission',
  COLLECTIONS.PERMISSIONS,
  permissionFields,
  {
    withCompanyScope: false,
    indexes: [
      { fields: { code: 1 }, options: { unique: true, name: 'uq_permissions_code' } },
      { fields: { module: 1, action: 1 }, options: { name: 'idx_permissions_module_action' } },
    ],
  },
);

export const roleModel = defineDomainModel<RoleDocument>(
  'Role',
  COLLECTIONS.ROLES,
  roleFields,
  {
    slug: { sourceField: 'name' },
    indexes: [
      { fields: { companyId: 1, slug: 1 }, options: { unique: true, name: 'uq_roles_company_slug' } },
    ],
  },
);

export const rolePermissionModel = defineDomainModel<RolePermissionDocument>(
  'RolePermission',
  COLLECTIONS.ROLE_PERMISSIONS,
  rolePermissionFields,
  {
    indexes: [
      { fields: { roleId: 1, permissionId: 1 }, options: { unique: true, name: 'uq_role_permissions' } },
    ],
  },
);

export const employeeRoleModel = defineDomainModel<EmployeeRoleDocument>(
  'EmployeeRole',
  COLLECTIONS.EMPLOYEE_ROLES,
  employeeRoleFields,
  {
    indexes: [
      { fields: { employeeId: 1, roleId: 1 }, options: { unique: true, name: 'uq_employee_roles' } },
    ],
  },
);

export const permissionGroupModel = defineDomainModel<PermissionGroupDocument>(
  'PermissionGroup',
  COLLECTIONS.PERMISSION_GROUPS,
  permissionGroupFields,
  {
    slug: { sourceField: 'name' },
    indexes: [
      { fields: { companyId: 1, slug: 1 }, options: { unique: true, name: 'uq_permission_groups_company_slug' } },
    ],
  },
);

export const PermissionModel = permissionModel.model;
export const RoleModel = roleModel.model;
export const RolePermissionModel = rolePermissionModel.model;
export const EmployeeRoleModel = employeeRoleModel.model;
export const PermissionGroupModel = permissionGroupModel.model;

export const PermissionRepository = permissionModel.repository;
export const RoleRepository = roleModel.repository;
export const RolePermissionRepository = rolePermissionModel.repository;
export const EmployeeRoleRepository = employeeRoleModel.repository;
export const PermissionGroupRepository = permissionGroupModel.repository;
