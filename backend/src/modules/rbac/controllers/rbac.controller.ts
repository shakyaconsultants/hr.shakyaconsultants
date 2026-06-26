import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import type { RbacActorContext } from '@modules/rbac/types/rbac.types.js';
import { PermissionManagementService } from '@modules/rbac/services/permission-management.service.js';
import { RoleManagementService } from '@modules/rbac/services/role-management.service.js';
import { RoleAssignmentService } from '@modules/rbac/services/role-assignment.service.js';
import { PermissionSimulatorService } from '@modules/rbac/services/permission-simulator.service.js';
import { ApprovalHierarchyService } from '@modules/rbac/services/approval-hierarchy.service.js';
import { ReportingHierarchyService } from '@modules/rbac/services/reporting-hierarchy.service.js';
import {
  approvalHierarchySchema,
  assignPermissionGroupSchema,
  assignPermissionsSchema,
  assignRoleSchema,
  bulkAssignRolesSchema,
  cloneRoleSchema,
  compareRolesSchema,
  createRoleSchema,
  employeeIdParamSchema,
  idParamSchema,
  listQuerySchema,
  reportingHierarchySchema,
  revokeRoleSchema,
  simulatorSchema,
  updateRoleSchema,
} from '@modules/rbac/validators/rbac.validator.js';

function buildActor(req: AuthenticatedRequest): RbacActorContext {
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    employeeId: req.user.employeeId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

export const listPermissions: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const result = await PermissionManagementService.list(query);
    return ResponseService.paginated(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getPermissionMatrix: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const matrix = await PermissionManagementService.getMatrix(authReq.user.companyId);
    return ResponseService.success(res, authReq, matrix);
  } catch (error) {
    next(error);
    return;
  }
};

export const listRoles: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const result = await RoleManagementService.list(authReq.user.companyId, query);
    return ResponseService.paginated(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getRole: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const role = await RoleManagementService.getById(authReq.user.companyId, id);
    const permissions = await RoleManagementService.getRolePermissions(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, { role, permissions });
  } catch (error) {
    next(error);
    return;
  }
};

export const createRole: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createRoleSchema, req.body);
    const role = await RoleManagementService.create(authReq.user.companyId, payload, buildActor(authReq));
    return ResponseService.created(res, authReq, role);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateRole: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateRoleSchema, req.body);
    const role = await RoleManagementService.update(authReq.user.companyId, id, payload, buildActor(authReq));
    return ResponseService.updated(res, authReq, role);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteRole: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await RoleManagementService.softDelete(authReq.user.companyId, id, buildActor(authReq));
    return ResponseService.deleted(res, authReq);
  } catch (error) {
    next(error);
    return;
  }
};

export const archiveRole: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const role = await RoleManagementService.archive(authReq.user.companyId, id, buildActor(authReq));
    return ResponseService.updated(res, authReq, role);
  } catch (error) {
    next(error);
    return;
  }
};

export const restoreRole: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const role = await RoleManagementService.restore(authReq.user.companyId, id, buildActor(authReq));
    return ResponseService.updated(res, authReq, role);
  } catch (error) {
    next(error);
    return;
  }
};

export const cloneRole: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(cloneRoleSchema, req.body);
    const role = await RoleManagementService.clone(authReq.user.companyId, id, payload, buildActor(authReq));
    return ResponseService.created(res, authReq, role);
  } catch (error) {
    next(error);
    return;
  }
};

export const assignPermissions: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { permissionCodes } = validateInput(assignPermissionsSchema, req.body);
    const result = await RoleManagementService.assignPermissions(
      authReq.user.companyId,
      id,
      permissionCodes,
      buildActor(authReq),
    );
    return ResponseService.success(res, authReq, result, 'Permissions assigned');
  } catch (error) {
    next(error);
    return;
  }
};

export const revokePermissions: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { permissionCodes } = validateInput(assignPermissionsSchema, req.body);
    const result = await RoleManagementService.revokePermissions(
      authReq.user.companyId,
      id,
      permissionCodes,
      buildActor(authReq),
    );
    return ResponseService.success(res, authReq, result, 'Permissions revoked');
  } catch (error) {
    next(error);
    return;
  }
};

export const assignPermissionGroup: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { groupId } = validateInput(assignPermissionGroupSchema, req.body);
    const result = await RoleManagementService.assignPermissionGroup(
      authReq.user.companyId,
      id,
      groupId,
      buildActor(authReq),
    );
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const compareRoles: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { roleIdA, roleIdB } = validateInput(compareRolesSchema, req.body);
    const result = await RoleManagementService.compareRoles(authReq.user.companyId, roleIdA, roleIdB);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const assignRole: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(assignRoleSchema, req.body);
    await RoleAssignmentService.assignRoleToEmployee(
      authReq.user.companyId,
      payload.employeeId,
      payload.roleId,
      buildActor(authReq),
      { isPrimary: payload.isPrimary },
    );
    return ResponseService.success(res, authReq, { assigned: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const revokeRole: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(revokeRoleSchema, req.body);
    await RoleAssignmentService.revokeRoleFromEmployee(
      authReq.user.companyId,
      payload.employeeId,
      payload.roleId,
      buildActor(authReq),
    );
    return ResponseService.success(res, authReq, { revoked: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const bulkAssignRoles: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(bulkAssignRolesSchema, req.body);
    const result = await RoleAssignmentService.bulkAssignRoles(
      authReq.user.companyId,
      payload.employeeId,
      payload.roleIds,
      buildActor(authReq),
    );
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getEffectivePermissions: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const result = await RoleAssignmentService.getEffectivePermissions(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getEmployeeRoles: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const result = await RoleAssignmentService.getEmployeeRoles(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const runSimulator: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const input = validateInput(simulatorSchema, req.body);
    const result = await PermissionSimulatorService.simulate(authReq.user.companyId, input);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const listApprovalHierarchy: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const levels = await ApprovalHierarchyService.list(authReq.user.companyId);
    return ResponseService.success(res, authReq, levels);
  } catch (error) {
    next(error);
    return;
  }
};

export const upsertApprovalLevel: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(approvalHierarchySchema, req.body);
    const level = await ApprovalHierarchyService.upsert(authReq.user.companyId, payload, buildActor(authReq));
    return ResponseService.updated(res, authReq, level);
  } catch (error) {
    next(error);
    return;
  }
};

export const listReportingHierarchy: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const entries = await ReportingHierarchyService.listForEmployee(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, entries);
  } catch (error) {
    next(error);
    return;
  }
};

export const assignReportingHierarchy: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(reportingHierarchySchema, req.body);
    const entry = await ReportingHierarchyService.assign(authReq.user.companyId, payload, buildActor(authReq));
    return ResponseService.created(res, authReq, entry);
  } catch (error) {
    next(error);
    return;
  }
};

export const listRoleTemplates: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const templates = await RoleManagementService.listTemplates(authReq.user.companyId);
    return ResponseService.success(res, authReq, templates);
  } catch (error) {
    next(error);
    return;
  }
};

export const listPermissionGroups: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const groups = await PermissionManagementService.listGroups(authReq.user.companyId);
    return ResponseService.success(res, authReq, groups);
  } catch (error) {
    next(error);
    return;
  }
};

export const listPermissionCategories: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const categories = await PermissionManagementService.listCategories(authReq.user.companyId);
    return ResponseService.success(res, authReq, categories);
  } catch (error) {
    next(error);
    return;
  }
};
