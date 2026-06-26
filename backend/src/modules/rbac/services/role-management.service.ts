import type { RoleDocument } from '@domain/permission/permission.schemas.js';
import {
  EmployeeRoleRepository,
  PermissionRepository,
  RolePermissionRepository,
  RoleRepository,
} from '@domain/permission/permission.schemas.js';
import { RoleTemplateRepository } from '@domain/permission/rbac.schemas.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { RbacActorContext } from '@modules/rbac/types/rbac.types.js';
import { RbacAuditService } from '@modules/rbac/services/rbac-audit.service.js';
import { SuperAdminGuardService } from '@modules/rbac/services/super-admin-guard.service.js';
import { EffectivePermissionService } from '@modules/rbac/services/effective-permission.service.js';
import { PermissionCacheService } from '@modules/rbac/services/permission-cache.service.js';

export interface RoleListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  includeArchived?: boolean;
  roleGroupId?: string;
}

function toRecord(doc: RoleDocument): Record<string, unknown> {
  return JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export const RoleManagementService = {
  async list(companyId: string, query: RoleListQuery): Promise<PaginatedResult<RoleDocument>> {
    const filters = [];
    if (query.status) {
      filters.push({ status: query.status });
    }
    if (!query.includeArchived) {
      filters.push({ isArchived: false });
    }
    if (query.roleGroupId) {
      filters.push({ roleGroupId: query.roleGroupId });
    }
    if (query.search) {
      filters.push(buildSearchFilter(query.search, ['name', 'slug', 'description']));
    }

    return RoleRepository.paginate(mergeFilters(...filters), {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'priority',
      sortOrder: 'asc',
      companyId,
      includeDeleted: query.includeArchived,
    });
  },

  async getById(companyId: string, id: string): Promise<RoleDocument> {
    const role = await RoleRepository.findById(id, { companyId });
    if (!role) {
      throw new NotFoundError('Role not found', ERROR_CODES.NOT_FOUND);
    }
    return role;
  },

  async create(
    companyId: string,
    payload: {
      name: string;
      slug?: string;
      description?: string;
      priority?: number;
      roleGroupId?: string;
      templateSourceId?: string;
      permissionCodes?: string[];
    },
    actor: RbacActorContext,
  ): Promise<RoleDocument> {
    const slug = payload.slug ?? slugify(payload.name);
    const existing = await RoleRepository.findOne({ slug }, { companyId });
    if (existing) {
      throw new ConflictError('Role slug already exists', ERROR_CODES.CONFLICT, { slug });
    }

    const id = generateUuid();
    const role = await RoleRepository.create(
      {
        id,
        companyId,
        name: payload.name,
        slug,
        description: payload.description,
        priority: payload.priority ?? 100,
        roleGroupId: payload.roleGroupId,
        templateSourceId: payload.templateSourceId,
        defaultPermissionCodes: payload.permissionCodes ?? [],
        isSystem: false,
        isArchived: false,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: actor.userId,
        updatedBy: actor.userId,
      },
      { companyId },
    );

    if (payload.permissionCodes && payload.permissionCodes.length > 0) {
      await this.assignPermissions(companyId, id, payload.permissionCodes, actor);
    }

    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'role',
      entityId: id,
      action: 'create',
      after: toRecord(role),
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return role;
  },

  async update(
    companyId: string,
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      priority: number;
      roleGroupId: string;
      status: string;
    }>,
    actor: RbacActorContext,
  ): Promise<RoleDocument> {
    const existing = await this.getById(companyId, id);
    SuperAdminGuardService.assertRoleCanBeDisabled(existing, payload);

    const before = toRecord(existing);
    const updated = await RoleRepository.update(
      id,
      { $set: { ...payload, updatedBy: actor.userId } },
      { companyId, updatedBy: actor.userId },
    );

    if (!updated) {
      throw new NotFoundError('Role not found', ERROR_CODES.NOT_FOUND);
    }

    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'role',
      entityId: id,
      action: 'update',
      before,
      after: toRecord(updated),
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return updated;
  },

  async softDelete(companyId: string, id: string, actor: RbacActorContext): Promise<void> {
    const role = await this.getById(companyId, id);
    SuperAdminGuardService.assertRoleCanBeDeleted(role);
    await SuperAdminGuardService.assertRoleNotInUse(id, companyId);

    await RoleRepository.softDelete(id, actor.userId, { companyId });
    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'role',
      entityId: id,
      action: 'delete',
      before: toRecord(role),
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },

  async archive(companyId: string, id: string, actor: RbacActorContext): Promise<RoleDocument> {
    const role = await this.getById(companyId, id);
    SuperAdminGuardService.assertRoleCanBeDisabled(role, { isArchived: true });

    const updated = await RoleRepository.update(
      id,
      { $set: { isArchived: true, updatedBy: actor.userId } },
      { companyId },
    );

    if (!updated) {
      throw new NotFoundError('Role not found', ERROR_CODES.NOT_FOUND);
    }

    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'role',
      entityId: id,
      action: 'archive',
      before: toRecord(role),
      after: toRecord(updated),
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return updated;
  },

  async restore(companyId: string, id: string, actor: RbacActorContext): Promise<RoleDocument> {
    const restored = await RoleRepository.restore(id, actor.userId, { companyId, includeDeleted: true });
    if (!restored) {
      throw new NotFoundError('Role not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await RoleRepository.update(
      id,
      { $set: { isArchived: false, updatedBy: actor.userId } },
      { companyId },
    );

    if (!updated) {
      throw new NotFoundError('Role not found', ERROR_CODES.NOT_FOUND);
    }

    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'role',
      entityId: id,
      action: 'restore',
      after: toRecord(updated),
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return updated;
  },

  async clone(
    companyId: string,
    sourceRoleId: string,
    payload: { name: string; slug?: string },
    actor: RbacActorContext,
  ): Promise<RoleDocument> {
    const source = await this.getById(companyId, sourceRoleId);
    const sourcePermissions = await RolePermissionRepository.findMany({ roleId: sourceRoleId }, { companyId });
    const permissionDocs = await PermissionRepository.findMany({
      id: { $in: sourcePermissions.map((p) => p.permissionId) },
    });

    const cloned = await this.create(
      companyId,
      {
        name: payload.name,
        slug: payload.slug,
        description: source.description ? `Cloned from ${source.name}` : undefined,
        priority: source.priority + 1,
        roleGroupId: source.roleGroupId,
        templateSourceId: sourceRoleId,
        permissionCodes: permissionDocs.map((p) => p.code),
      },
      actor,
    );

    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'role',
      entityId: cloned.id,
      action: 'clone',
      after: { sourceRoleId, clonedRoleId: cloned.id },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return cloned;
  },

  async getRolePermissions(companyId: string, roleId: string): Promise<string[]> {
    return EffectivePermissionService.calculateForRoleIds(companyId, [roleId]);
  },

  async assignPermissions(
    companyId: string,
    roleId: string,
    permissionCodes: string[],
    actor: RbacActorContext,
  ): Promise<{ assigned: number }> {
    const role = await this.getById(companyId, roleId);
    SuperAdminGuardService.assertPermissionsCanBeModified(role);

    const permissions = await PermissionRepository.findMany({
      code: { $in: permissionCodes },
      status: ENTITY_STATUS.ACTIVE,
    });

    let assigned = 0;
    for (const permission of permissions) {
      const exists = await RolePermissionRepository.findOne(
        { roleId, permissionId: permission.id },
        { companyId },
      );
      if (exists) {
        continue;
      }

      await RolePermissionRepository.create(
        {
          id: generateUuid(),
          companyId,
          roleId,
          permissionId: permission.id,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        { companyId },
      );
      assigned += 1;
    }

    await this.invalidateRoleCache(companyId, roleId);
    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'role_permission',
      entityId: roleId,
      action: 'assign',
      after: { permissionCodes, assigned },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return { assigned };
  },

  async revokePermissions(
    companyId: string,
    roleId: string,
    permissionCodes: string[],
    actor: RbacActorContext,
  ): Promise<{ revoked: number }> {
    const role = await this.getById(companyId, roleId);
    SuperAdminGuardService.assertPermissionsCanBeModified(role);

    const permissions = await PermissionRepository.findMany({ code: { $in: permissionCodes } });
    let revoked = 0;

    for (const permission of permissions) {
      const link = await RolePermissionRepository.findOne(
        { roleId, permissionId: permission.id },
        { companyId },
      );
      if (!link) {
        continue;
      }
      await RolePermissionRepository.softDelete(link.id, actor.userId, { companyId });
      revoked += 1;
    }

    await this.invalidateRoleCache(companyId, roleId);
    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'role_permission',
      entityId: roleId,
      action: 'revoke',
      before: { permissionCodes },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return { revoked };
  },

  async assignPermissionGroup(
    companyId: string,
    roleId: string,
    groupId: string,
    actor: RbacActorContext,
  ): Promise<{ assigned: number }> {
    const permissions = await PermissionRepository.findMany({
      permissionGroupId: groupId,
      status: ENTITY_STATUS.ACTIVE,
    });
    return this.assignPermissions(
      companyId,
      roleId,
      permissions.map((p) => p.code),
      actor,
    );
  },

  async createFromTemplate(
    companyId: string,
    templateId: string,
    payload: { name: string; slug?: string },
    actor: RbacActorContext,
  ): Promise<RoleDocument> {
    const template = await RoleTemplateRepository.findById(templateId, { companyId });
    if (!template) {
      throw new NotFoundError('Role template not found', ERROR_CODES.NOT_FOUND);
    }

    return this.create(
      companyId,
      {
        name: payload.name,
        slug: payload.slug,
        description: template.description,
        priority: template.priority,
        roleGroupId: template.roleGroupId,
        templateSourceId: templateId,
        permissionCodes: template.permissionCodes,
      },
      actor,
    );
  },

  async compareRoles(companyId: string, roleIdA: string, roleIdB: string) {
    const [roleA, roleB] = await Promise.all([
      this.getById(companyId, roleIdA),
      this.getById(companyId, roleIdB),
    ]);

    const [permsA, permsB] = await Promise.all([
      this.getRolePermissions(companyId, roleIdA),
      this.getRolePermissions(companyId, roleIdB),
    ]);

    const setA = new Set(permsA);
    const setB = new Set(permsB);

    return {
      roleA: { id: roleA.id, name: roleA.name, permissions: permsA },
      roleB: { id: roleB.id, name: roleB.name, permissions: permsB },
      onlyInA: permsA.filter((p) => !setB.has(p)),
      onlyInB: permsB.filter((p) => !setA.has(p)),
      shared: permsA.filter((p) => setB.has(p)),
    };
  },

  async invalidateRoleCache(companyId: string, roleId: string): Promise<void> {
    const assignments = await EmployeeRoleRepository.findMany({ roleId, effectiveTo: null }, { companyId });
    await Promise.all(
      assignments.map((a) => PermissionCacheService.invalidate(companyId, a.employeeId)),
    );
  },

  async listTemplates(companyId: string) {
    return RoleTemplateRepository.findMany({}, { companyId });
  },
};
