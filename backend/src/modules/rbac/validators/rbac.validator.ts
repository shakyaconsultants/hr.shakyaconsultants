import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  module: z.string().optional(),
  groupId: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  includeArchived: z.coerce.boolean().optional(),
  roleGroupId: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.uuid() });

export const createRoleSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().optional(),
  priority: z.number().int().min(0).optional(),
  roleGroupId: z.uuid().optional(),
  templateSourceId: z.uuid().optional(),
  permissionCodes: z.array(z.string()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial().omit({ permissionCodes: true });

export const cloneRoleSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
});

export const assignPermissionsSchema = z.object({
  permissionCodes: z.array(z.string()).min(1),
});

export const assignPermissionGroupSchema = z.object({
  groupId: z.uuid(),
});

export const assignRoleSchema = z.object({
  employeeId: z.uuid(),
  roleId: z.uuid(),
  isPrimary: z.boolean().optional(),
});

export const bulkAssignRolesSchema = z.object({
  employeeId: z.uuid(),
  roleIds: z.array(z.uuid()).min(1),
});

export const revokeRoleSchema = z.object({
  employeeId: z.uuid(),
  roleId: z.uuid(),
});

export const simulatorSchema = z.object({
  roleIds: z.array(z.uuid()).optional(),
  permissionCodes: z.array(z.string()).optional(),
  employeeId: z.uuid().optional(),
});

export const compareRolesSchema = z.object({
  roleIdA: z.uuid(),
  roleIdB: z.uuid(),
});

export const approvalHierarchySchema = z.object({
  level: z.number().int().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  roleSlug: z.string().optional(),
  priority: z.number().int().min(0).optional(),
});

export const reportingHierarchySchema = z.object({
  employeeId: z.uuid(),
  managerId: z.uuid(),
  relationshipType: z.enum(['direct', 'dotted_line', 'department_head', 'branch_head']),
  isPrimary: z.boolean().optional(),
});

export const employeeIdParamSchema = z.object({ employeeId: z.uuid() });
