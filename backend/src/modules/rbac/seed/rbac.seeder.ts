import { CompanyRepository } from '@domain/company/company.schema.js';
import {
  PermissionGroupRepository,
  PermissionRepository,
  RolePermissionRepository,
  RoleRepository,
} from '@domain/permission/permission.schemas.js';
import {
  ApprovalHierarchyLevelRepository,
  PermissionCategoryRepository,
  RoleGroupRepository,
  RoleTemplateRepository,
} from '@domain/permission/rbac.schemas.js';
import { registerSeeder } from '@infrastructure/database/seed/seed.registry.js';
import { ENTERPRISE_PERMISSION_CATALOG } from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';
import {
  DEFAULT_APPROVAL_HIERARCHY,
  DEFAULT_ROLE_CATALOG,
  DEFAULT_ROLE_GROUPS,
} from '@modules/rbac/constants/role-catalog.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { databaseLogger } from '@logging/winston.logger.js';

const SYSTEM_ACTOR = 'system';
const RBAC_SEEDER = 'rbac';

async function resolveCompanyId(fallbackCompanyId: string): Promise<string | null> {
  if (fallbackCompanyId !== 'system') {
    return fallbackCompanyId;
  }
  const companies = await CompanyRepository.findMany({}, {});
  return companies[0]?.id ?? null;
}

export async function seedRbac(companyId: string): Promise<void> {
  const categoryMap = new Map<string, string>();
  const uniqueCategories = [...new Set(ENTERPRISE_PERMISSION_CATALOG.map((e) => e.category))];

  for (const category of uniqueCategories) {
    const existing = await PermissionCategoryRepository.findOne({ slug: category }, { companyId });
    if (existing) {
      categoryMap.set(category, existing.id);
      continue;
    }

    const id = generateUuid();
    categoryMap.set(category, id);
    await PermissionCategoryRepository.create(
      {
        id,
        companyId,
        name: category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: category,
        module: ENTERPRISE_PERMISSION_CATALOG.find((e) => e.category === category)?.module ?? 'system',
        sortOrder: 0,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }

  const groupMap = new Map<string, string>();
  for (const groupSlug of [...new Set(ENTERPRISE_PERMISSION_CATALOG.map((e) => e.groupSlug))]) {
    const existing = await PermissionGroupRepository.findOne({ slug: groupSlug }, { companyId });
    if (existing) {
      groupMap.set(groupSlug, existing.id);
      continue;
    }

    const id = generateUuid();
    groupMap.set(groupSlug, id);
    await PermissionGroupRepository.create(
      {
        id,
        companyId,
        name: groupSlug.charAt(0).toUpperCase() + groupSlug.slice(1),
        slug: groupSlug,
        module: groupSlug,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }

  const permissionIdByCode = new Map<string, string>();
  const existingPermissions = await PermissionRepository.findMany({});
  for (const permission of existingPermissions) {
    permissionIdByCode.set(permission.code, permission.id);
  }

  for (const entry of ENTERPRISE_PERMISSION_CATALOG) {
    if (permissionIdByCode.has(entry.code)) {
      continue;
    }

    const id = generateUuid();
    permissionIdByCode.set(entry.code, id);
    await PermissionRepository.create({
      id,
      companyId,
      code: entry.code,
      name: entry.name,
      description: entry.description,
      module: entry.module,
      action: entry.action,
      category: entry.category,
      permissionGroupId: groupMap.get(entry.groupSlug),
      dependsOn: entry.dependsOn ?? [],
      metadata: {},
      isSystem: entry.isSystem ?? true,
      sortOrder: entry.sortOrder ?? 0,
      status: ENTITY_STATUS.ACTIVE,
      createdBy: SYSTEM_ACTOR,
      updatedBy: SYSTEM_ACTOR,
    });
  }

  for (const group of DEFAULT_ROLE_GROUPS) {
    const existing = await RoleGroupRepository.findOne({ slug: group.slug }, { companyId });
    if (existing) {
      continue;
    }
    await RoleGroupRepository.create(
      {
        id: generateUuid(),
        companyId,
        name: group.name,
        slug: group.slug,
        sortOrder: group.sortOrder,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }

  const roleIdBySlug = new Map<string, string>();
  const existingRoles = await RoleRepository.findMany({}, { companyId });
  for (const role of existingRoles) {
    roleIdBySlug.set(role.slug, role.id);
  }

  for (const roleDef of DEFAULT_ROLE_CATALOG) {
    if (roleIdBySlug.has(roleDef.slug)) {
      continue;
    }

    const id = generateUuid();
    roleIdBySlug.set(roleDef.slug, id);
    await RoleRepository.create(
      {
        id,
        companyId,
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        priority: roleDef.priority,
        isSystem: roleDef.isSystem,
        isArchived: false,
        defaultPermissionCodes: roleDef.permissionCodes ?? [],
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }

  for (const roleDef of DEFAULT_ROLE_CATALOG) {
    const roleId = roleIdBySlug.get(roleDef.slug);
    if (!roleId) {
      continue;
    }

    let codes: string[] = [];
    if (roleDef.slug === SYSTEM_ROLE_SLUG.SUPER_ADMIN) {
      codes = ENTERPRISE_PERMISSION_CATALOG.map((e) => e.code);
    } else if (roleDef.permissionCodes) {
      codes = roleDef.permissionCodes;
    } else if (roleDef.permissionFilter) {
      const filter = roleDef.permissionFilter;
      codes = ENTERPRISE_PERMISSION_CATALOG.filter((e) => filter(e.code, e.module)).map((e) => e.code);
    }

    for (const code of codes) {
      const permissionId = permissionIdByCode.get(code);
      if (!permissionId) {
        continue;
      }

      const exists = await RolePermissionRepository.findOne({ roleId, permissionId }, { companyId });
      if (exists) {
        continue;
      }

      await RolePermissionRepository.create(
        {
          id: generateUuid(),
          companyId,
          roleId,
          permissionId,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId },
      );
    }
  }

  for (const template of DEFAULT_ROLE_CATALOG.filter((r) => r.slug !== SYSTEM_ROLE_SLUG.SUPER_ADMIN)) {
    const templateSlug = `${template.slug}-template`;
    const existing = await RoleTemplateRepository.findOne({ slug: templateSlug }, { companyId });
    if (existing) {
      continue;
    }

    let codes: string[] = template.permissionCodes ?? [];
    if (template.permissionFilter) {
      const filter = template.permissionFilter;
      codes = ENTERPRISE_PERMISSION_CATALOG.filter((e) => filter(e.code, e.module)).map((e) => e.code);
    }

    await RoleTemplateRepository.create(
      {
        id: generateUuid(),
        companyId,
        name: `${template.name} Template`,
        slug: templateSlug,
        description: template.description,
        priority: template.priority,
        permissionCodes: codes,
        isSystem: true,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }

  for (const level of DEFAULT_APPROVAL_HIERARCHY) {
    const existing = await ApprovalHierarchyLevelRepository.findOne({ slug: level.slug }, { companyId });
    if (existing) {
      continue;
    }

    await ApprovalHierarchyLevelRepository.create(
      {
        id: generateUuid(),
        companyId,
        level: level.level,
        name: level.name,
        slug: level.slug,
        roleSlug: 'roleSlug' in level ? level.roleSlug : undefined,
        priority: level.priority,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }
}

registerSeeder({
  name: RBAC_SEEDER,
  order: 2,
  run: async (context) => {
    const companyId = await resolveCompanyId(context.companyId);
    if (!companyId) {
      databaseLogger.info('No company found — RBAC seed skipped');
      return;
    }
    await seedRbac(companyId);
  },
});
