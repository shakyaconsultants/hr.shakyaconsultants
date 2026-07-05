import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { isSuperAdminRequest } from '@modules/auth/utils/super-admin-auth.util.js';
import { PermissionEngineService } from '@modules/auth/services/permission-engine.service.js';

export interface ApprovalActorContext {
  companyId: string;
  userId: string;
  employeeId?: string;
  isSuperAdmin?: boolean;
  /** Resolved permission codes for the current request (when loaded by authorize middleware). */
  permissions?: string[];
  ip?: string;
  userAgent?: string;
}

export interface ApprovalListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  requestType?: string;
  entityType?: string;
  search?: string;
}

export function buildApprovalActor(req: AuthenticatedRequest): ApprovalActorContext {
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    employeeId: req.user.employeeId,
    isSuperAdmin: req.auth?.isSuperAdmin === true,
    permissions: req.auth?.permissions,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  };
}

/** Ensures super-admin flag and permissions are loaded before building an approval actor. */
export async function resolveApprovalActor(req: AuthenticatedRequest): Promise<ApprovalActorContext> {
  await isSuperAdminRequest(req);

  if (!Array.isArray(req.auth?.permissions) && req.user.employeeId) {
    const permissions = await PermissionEngineService.getPermissionsForUser(
      req.user.companyId,
      req.user.employeeId,
    );
    req.auth = { ...req.auth, permissions };
  }

  return buildApprovalActor(req);
}

export type LeaveExitActorContext = ApprovalActorContext;
export type AttendanceActorContext = ApprovalActorContext;
export type PayrollActorContext = ApprovalActorContext;
export type SalesActorContext = ApprovalActorContext;
export type CommunicationActorContext = ApprovalActorContext;
export type ReportsActorContext = ApprovalActorContext;
export type IntegrationActorContext = ApprovalActorContext;

export function buildLeaveExitActor(req: AuthenticatedRequest): LeaveExitActorContext {
  return buildApprovalActor(req);
}

export function buildAttendanceActor(req: AuthenticatedRequest): AttendanceActorContext {
  return buildApprovalActor(req);
}

export function buildPayrollActor(req: AuthenticatedRequest): PayrollActorContext {
  return buildApprovalActor(req);
}

export function buildSalesActor(req: AuthenticatedRequest): SalesActorContext {
  return buildApprovalActor(req);
}

export function buildCommunicationActor(req: AuthenticatedRequest): CommunicationActorContext {
  return buildApprovalActor(req);
}

export function buildReportsActor(req: AuthenticatedRequest): ReportsActorContext {
  return buildApprovalActor(req);
}

export function buildIntegrationActor(req: AuthenticatedRequest): IntegrationActorContext {
  return buildApprovalActor(req);
}
