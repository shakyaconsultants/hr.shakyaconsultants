import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { RBAC_PERMISSIONS } from '@modules/rbac/constants/rbac-permissions.constants.js';
import { RBAC_ROUTES } from '@modules/rbac/constants/rbac.constants.js';
import {
  archiveRole,
  assignPermissionGroup,
  assignPermissions,
  assignReportingHierarchy,
  assignRole,
  bulkAssignRoles,
  cloneRole,
  compareRoles,
  createRole,
  deleteRole,
  getEffectivePermissions,
  getEmployeeRoles,
  getPermissionMatrix,
  getRole,
  listApprovalHierarchy,
  listPermissionCategories,
  listPermissionGroups,
  listPermissions,
  listReportingHierarchy,
  listRoleTemplates,
  listRoles,
  restoreRole,
  revokePermissions,
  revokeRole,
  runSimulator,
  updateRole,
  upsertApprovalLevel,
} from '@modules/rbac/controllers/rbac.controller.js';

const rbacRoutes = Router();

rbacRoutes.use(authenticateMiddleware);
rbacRoutes.use(companyScopeMiddleware());

/**
 * @swagger
 * /rbac/permissions:
 *   get:
 *     summary: List permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 */
rbacRoutes.get(RBAC_ROUTES.PERMISSIONS, authorize(RBAC_PERMISSIONS.PERMISSION_READ), listPermissions);

/**
 * @swagger
 * /rbac/matrix:
 *   get:
 *     summary: Get permission matrix
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 */
rbacRoutes.get(RBAC_ROUTES.MATRIX, authorize(RBAC_PERMISSIONS.MATRIX_READ), getPermissionMatrix);

rbacRoutes.get(RBAC_ROUTES.PERMISSION_GROUPS, authorize(RBAC_PERMISSIONS.PERMISSION_READ), listPermissionGroups);
rbacRoutes.get(RBAC_ROUTES.PERMISSION_CATEGORIES, authorize(RBAC_PERMISSIONS.PERMISSION_READ), listPermissionCategories);

/**
 * @swagger
 * /rbac/roles:
 *   get:
 *     summary: List roles
 *     tags: [RBAC]
 */
rbacRoutes.get(RBAC_ROUTES.ROLES, authorize(RBAC_PERMISSIONS.ROLE_READ), listRoles);
rbacRoutes.post(RBAC_ROUTES.ROLES, authorize(RBAC_PERMISSIONS.ROLE_CREATE), createRole);
rbacRoutes.get(`${RBAC_ROUTES.ROLES}/:id`, authorize(RBAC_PERMISSIONS.ROLE_READ), getRole);
rbacRoutes.patch(`${RBAC_ROUTES.ROLES}/:id`, authorize(RBAC_PERMISSIONS.ROLE_UPDATE), updateRole);
rbacRoutes.delete(`${RBAC_ROUTES.ROLES}/:id`, authorize(RBAC_PERMISSIONS.ROLE_DELETE), deleteRole);
rbacRoutes.post(`${RBAC_ROUTES.ROLES}/:id/archive`, authorize(RBAC_PERMISSIONS.ROLE_UPDATE), archiveRole);
rbacRoutes.post(`${RBAC_ROUTES.ROLES}/:id/restore`, authorize(RBAC_PERMISSIONS.ROLE_UPDATE), restoreRole);
rbacRoutes.post(`${RBAC_ROUTES.ROLES}/:id/clone`, authorize(RBAC_PERMISSIONS.ROLE_CLONE), cloneRole);
rbacRoutes.post(`${RBAC_ROUTES.ROLES}/:id/permissions`, authorize(RBAC_PERMISSIONS.ROLE_UPDATE), assignPermissions);
rbacRoutes.delete(`${RBAC_ROUTES.ROLES}/:id/permissions`, authorize(RBAC_PERMISSIONS.ROLE_UPDATE), revokePermissions);
rbacRoutes.post(`${RBAC_ROUTES.ROLES}/:id/permission-groups`, authorize(RBAC_PERMISSIONS.ROLE_UPDATE), assignPermissionGroup);
rbacRoutes.post(`${RBAC_ROUTES.ROLES}/compare`, authorize(RBAC_PERMISSIONS.ROLE_READ), compareRoles);

rbacRoutes.get(RBAC_ROUTES.ROLE_TEMPLATES, authorize(RBAC_PERMISSIONS.ROLE_READ), listRoleTemplates);

rbacRoutes.post(`${RBAC_ROUTES.ASSIGNMENTS}/roles`, authorize(RBAC_PERMISSIONS.ASSIGNMENT_MANAGE), assignRole);
rbacRoutes.delete(`${RBAC_ROUTES.ASSIGNMENTS}/roles`, authorize(RBAC_PERMISSIONS.ASSIGNMENT_MANAGE), revokeRole);
rbacRoutes.post(`${RBAC_ROUTES.ASSIGNMENTS}/roles/bulk`, authorize(RBAC_PERMISSIONS.ASSIGNMENT_MANAGE), bulkAssignRoles);
rbacRoutes.get(`${RBAC_ROUTES.EFFECTIVE}/:employeeId`, authorize(RBAC_PERMISSIONS.ASSIGNMENT_READ), getEffectivePermissions);
rbacRoutes.get(`${RBAC_ROUTES.ASSIGNMENTS}/employees/:employeeId`, authorize(RBAC_PERMISSIONS.ASSIGNMENT_READ), getEmployeeRoles);

/**
 * @swagger
 * /rbac/simulator:
 *   post:
 *     summary: Run permission simulator
 *     tags: [RBAC]
 */
rbacRoutes.post(RBAC_ROUTES.SIMULATOR, authorize(RBAC_PERMISSIONS.SIMULATOR_RUN), runSimulator);

rbacRoutes.get(RBAC_ROUTES.APPROVAL_HIERARCHY, authorize(RBAC_PERMISSIONS.HIERARCHY_READ), listApprovalHierarchy);
rbacRoutes.put(RBAC_ROUTES.APPROVAL_HIERARCHY, authorize(RBAC_PERMISSIONS.HIERARCHY_MANAGE), upsertApprovalLevel);

rbacRoutes.get(`${RBAC_ROUTES.REPORTING_HIERARCHY}/:employeeId`, authorize(RBAC_PERMISSIONS.HIERARCHY_READ), listReportingHierarchy);
rbacRoutes.post(RBAC_ROUTES.REPORTING_HIERARCHY, authorize(RBAC_PERMISSIONS.HIERARCHY_MANAGE), assignReportingHierarchy);

export { rbacRoutes };
