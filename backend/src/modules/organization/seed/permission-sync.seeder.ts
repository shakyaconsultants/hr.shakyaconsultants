import { CompanyRepository } from '@domain/company/company.schema.js';
import {
  PermissionGroupRepository,
  PermissionRepository,
  RolePermissionRepository,
  RoleRepository,
} from '@domain/permission/permission.schemas.js';
import { PERMISSION_CATALOG } from '@modules/auth/constants/permission-catalog.constants.js';
import { SUPER_ADMIN_ROLE } from '@modules/auth/constants/role-seed.constants.js';
import { registerSeeder, SEEDER_NAMES } from '@infrastructure/database/seed/seed.registry.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { databaseLogger } from '@logging/winston.logger.js';

const SYSTEM_ACTOR = 'system';

async function resolveCompanyId(fallbackCompanyId: string): Promise<string | null> {
  if (fallbackCompanyId !== 'system') {
    return fallbackCompanyId;
  }
  const companies = await CompanyRepository.findMany({}, {});
  return companies[0]?.id ?? null;
}

export async function syncPermissions(companyId: string): Promise<void> {
  const permissionGroupMap = new Map<string, string>();
  const existingGroups = await PermissionGroupRepository.findMany({}, { companyId });

  for (const group of existingGroups) {
    permissionGroupMap.set(group.slug, group.id);
  }

  for (const groupSlug of [...new Set(PERMISSION_CATALOG.map((entry) => entry.groupSlug))]) {
    if (permissionGroupMap.has(groupSlug)) {
      continue;
    }

    const groupId = generateUuid();
    const catalogEntry = PERMISSION_CATALOG.find((entry) => entry.groupSlug === groupSlug);
    permissionGroupMap.set(groupSlug, groupId);

    await PermissionGroupRepository.create(
      {
        id: groupId,
        companyId,
        name: groupSlug.charAt(0).toUpperCase() + groupSlug.slice(1),
        slug: groupSlug,
        module: catalogEntry?.module ?? groupSlug,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }

  const existingPermissions = await PermissionRepository.findMany({}, { companyId });
  const permissionIdByCode = new Map(existingPermissions.map((p) => [p.code, p.id]));

  for (const entry of PERMISSION_CATALOG) {
    if (permissionIdByCode.has(entry.code)) {
      continue;
    }

    const permissionId = generateUuid();
    permissionIdByCode.set(entry.code, permissionId);

    await PermissionRepository.create(
      {
        id: permissionId,
        companyId,
        code: entry.code,
        name: entry.name,
        module: entry.module,
        action: entry.action,
        permissionGroupId: permissionGroupMap.get(entry.groupSlug),
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }

  const superAdminRole = await RoleRepository.findOne({ slug: SUPER_ADMIN_ROLE.slug }, { companyId });
  if (!superAdminRole) {
    databaseLogger.warn('Super admin role not found — skipping role permission sync');
    return;
  }

  const existingRolePermissions = await RolePermissionRepository.findMany(
    { roleId: superAdminRole.id },
    { companyId },
  );
  const assignedPermissionIds = new Set(existingRolePermissions.map((rp) => rp.permissionId));

  for (const entry of PERMISSION_CATALOG) {
    const permissionId = permissionIdByCode.get(entry.code);
    if (!permissionId || assignedPermissionIds.has(permissionId)) {
      continue;
    }

    await RolePermissionRepository.create(
      {
        id: generateUuid(),
        companyId,
        roleId: superAdminRole.id,
        permissionId,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }
}

registerSeeder({
  name: SEEDER_NAMES.PERMISSIONS,
  order: 2,
  run: async (context) => {
    const companyId = await resolveCompanyId(context.companyId);
    if (!companyId) {
      databaseLogger.info('No company found — permission sync skipped');
      return;
    }
    await syncPermissions(companyId);
  },
});
