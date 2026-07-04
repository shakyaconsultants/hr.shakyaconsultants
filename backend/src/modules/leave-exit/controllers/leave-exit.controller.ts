import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { AuthorizationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { buildLeaveExitActor } from '@modules/approval/types/approval.types.js';
import { LeavePolicyService } from '@modules/leave-exit/services/leave-policy.service.js';
import { LeaveBalanceService } from '@modules/leave-exit/services/leave-balance.service.js';
import { LeaveRequestService } from '@modules/leave-exit/services/leave-request.service.js';
import { ResignationService } from '@modules/leave-exit/services/resignation.service.js';
import { ExitManagementService } from '@modules/leave-exit/services/exit-management.service.js';
import { FullFinalPreparationService } from '@modules/leave-exit/services/full-final-preparation.service.js';
import { CompanyCalendarService } from '@modules/leave-exit/services/company-calendar.service.js';
import { LeaveExitSeederService } from '@modules/leave-exit/services/leave-exit-seeder.service.js';
import {
  applyLeaveSchema,
  balanceAdjustSchema,
  calendarQuerySchema,
  completeChecklistSchema,
  createPolicySchema,
  idParamSchema,
  listQuerySchema,
  submitResignationSchema,
} from '@modules/leave-exit/validators/leave-exit.validator.js';

function actor(req: AuthenticatedRequest) {
  return buildLeaveExitActor(req);
}

const LEAVE_TEAM_VIEW_PERMISSIONS = ['leave.update', 'leave.approve', 'leave.policy.manage', 'leave.balance.manage'] as const;

async function resolveLinkedEmployeeId(authReq: AuthenticatedRequest): Promise<string | undefined> {
  if (authReq.user.employeeId) {
    return authReq.user.employeeId;
  }
  const employee = await EmployeeRepository.findOne({ userId: authReq.user.userId }, { companyId: authReq.user.companyId });
  return employee?.id;
}

function canViewTeamLeaveRequests(authReq: AuthenticatedRequest): boolean {
  const permissions = authReq.auth?.permissions ?? [];
  return LEAVE_TEAM_VIEW_PERMISSIONS.some((code) => permissions.includes(code));
}

export const seedLeaveExitDefaults: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    await LeaveExitSeederService.seedDefaults(actor(authReq));
    return ResponseService.success(res, authReq, { seeded: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listPolicies: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await LeavePolicyService.list(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createPolicy: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createPolicySchema, req.body);
    const data = await LeavePolicyService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getBalances: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : authReq.user.employeeId;
    if (!employeeId) {
      return ResponseService.success(res, authReq, []);
    }
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data = await LeaveBalanceService.getForEmployee(authReq.user.companyId, employeeId, year);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const adjustBalance: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(balanceAdjustSchema, req.body);
    const data = await LeaveBalanceService.adjust(actor(authReq), payload.employeeId, payload.leavePolicyId, payload.amount, payload.notes);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listLeaveRequests: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const teamView = canViewTeamLeaveRequests(authReq);
    const linkedEmployeeId = await resolveLinkedEmployeeId(authReq);

    let employeeId = query.employeeId;
    if (query.scope === 'mine' || (!teamView && !employeeId)) {
      employeeId = linkedEmployeeId;
    }

    if (!teamView) {
      if (!linkedEmployeeId) {
        return ResponseService.paginated(res, authReq, {
          items: [],
          pagination: { page: query.page ?? 1, pageSize: query.pageSize ?? 20, total: 0, totalPages: 0 },
        });
      }
      if (employeeId && employeeId !== linkedEmployeeId) {
        throw new AuthorizationError('You can only view your own leave requests', ERROR_CODES.AUTH_FORBIDDEN);
      }
      employeeId = linkedEmployeeId;
    }

    const data = await LeaveRequestService.list(authReq.user.companyId, {
      ...query,
      employeeId,
    });
    return ResponseService.paginated(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const applyLeave: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(applyLeaveSchema, req.body);
    const linkedEmployeeId = await resolveLinkedEmployeeId(authReq);
    const teamView = canViewTeamLeaveRequests(authReq);
    const employeeId = payload.employeeId ?? linkedEmployeeId;

    if (!employeeId) {
      throw new AuthorizationError('Employee profile is required to apply for leave', ERROR_CODES.AUTH_FORBIDDEN);
    }
    if (!teamView && employeeId !== linkedEmployeeId) {
      throw new AuthorizationError('You can only apply leave for yourself', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const data = await LeaveRequestService.apply(actor(authReq), { ...payload, employeeId });
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const withdrawLeave: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await LeaveRequestService.withdraw(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getLeaveCalendar: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(calendarQuerySchema, req.query);
    const data = await LeaveRequestService.getCalendar(authReq.user.companyId, query.startDate, query.endDate, query.employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getCompanyCalendar: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(calendarQuerySchema, req.query);
    const data = await CompanyCalendarService.getEvents(authReq.user.companyId, query.startDate, query.endDate, query.employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listResignations: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : undefined;
    const data = await ResignationService.list(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const submitResignation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(submitResignationSchema, req.body);
    const data = await ResignationService.submit(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const withdrawResignation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ResignationService.withdraw(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getExitProcess: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ExitManagementService.getProcess(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const completeExitItem: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { notes } = validateInput(completeChecklistSchema, req.body);
    const data = await ExitManagementService.completeChecklistItem(actor(authReq), id, notes);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listExitTemplates: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await ExitManagementService.listTemplates(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getFullFinalPrep: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : authReq.user.employeeId;
    if (!employeeId) {
      return ResponseService.success(res, authReq, null);
    }
    const data = await FullFinalPreparationService.getByEmployee(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};
