import { type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const APPROVAL_LEVEL_SLUG = {
  MANAGER: 'manager',
  DEPARTMENT_HEAD: 'department_head',
  HR: 'hr',
  DIRECTOR: 'director',
  SUPER_ADMIN: 'super_admin',
} as const;

export interface PermissionCategoryDocument extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  module: string;
  sortOrder: number;
  status: string;
}

export interface RoleGroupDocument extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  status: string;
}

export interface RoleTemplateDocument extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  roleGroupId?: string;
  priority: number;
  permissionCodes: string[];
  isSystem: boolean;
  status: string;
}

export interface ApprovalHierarchyLevelDocument extends BaseDocument {
  level: number;
  name: string;
  slug: string;
  roleSlug?: string;
  priority: number;
  status: string;
}

const permissionCategoryFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, trim: true },
  module: { type: String, required: true, trim: true, index: true },
  sortOrder: { type: Number, default: 0 },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const roleGroupFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, trim: true },
  sortOrder: { type: Number, default: 0 },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const roleTemplateFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, trim: true },
  roleGroupId: { type: String, index: true },
  priority: { type: Number, default: 100, min: 0 },
  permissionCodes: { type: [String], default: [] },
  isSystem: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const approvalHierarchyLevelFields: SchemaDefinition = {
  level: { type: Number, required: true, min: 1 },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  roleSlug: { type: String, trim: true, index: true },
  priority: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

export const permissionCategoryModel = defineDomainModel<PermissionCategoryDocument>(
  'PermissionCategory',
  COLLECTIONS.PERMISSION_CATEGORIES,
  permissionCategoryFields,
  {
    slug: { sourceField: 'name' },
    indexes: [
      { fields: { companyId: 1, slug: 1 }, options: { unique: true, name: 'uq_permission_categories_company_slug' } },
    ],
  },
);

export const roleGroupModel = defineDomainModel<RoleGroupDocument>(
  'RoleGroup',
  COLLECTIONS.ROLE_GROUPS,
  roleGroupFields,
  {
    slug: { sourceField: 'name' },
    indexes: [
      { fields: { companyId: 1, slug: 1 }, options: { unique: true, name: 'uq_role_groups_company_slug' } },
    ],
  },
);

export const roleTemplateModel = defineDomainModel<RoleTemplateDocument>(
  'RoleTemplate',
  COLLECTIONS.ROLE_TEMPLATES,
  roleTemplateFields,
  {
    slug: { sourceField: 'name' },
    indexes: [
      { fields: { companyId: 1, slug: 1 }, options: { unique: true, name: 'uq_role_templates_company_slug' } },
    ],
  },
);

export const approvalHierarchyLevelModel = defineDomainModel<ApprovalHierarchyLevelDocument>(
  'ApprovalHierarchyLevel',
  COLLECTIONS.APPROVAL_HIERARCHY_LEVELS,
  approvalHierarchyLevelFields,
  {
    indexes: [
      { fields: { companyId: 1, slug: 1 }, options: { unique: true, name: 'uq_approval_hierarchy_company_slug' } },
      { fields: { companyId: 1, level: 1 }, options: { unique: true, name: 'uq_approval_hierarchy_company_level' } },
    ],
  },
);

export const PermissionCategoryRepository = permissionCategoryModel.repository;
export const RoleGroupRepository = roleGroupModel.repository;
export const RoleTemplateRepository = roleTemplateModel.repository;
export const ApprovalHierarchyLevelRepository = approvalHierarchyLevelModel.repository;
