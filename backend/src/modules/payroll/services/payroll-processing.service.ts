import { AttendanceRepository } from '@domain/attendance/attendance.schemas.js';
import { APPROVAL_REQUEST_STATUS } from '@domain/approval/approval.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { PayrollRepository } from '@domain/payroll/payroll.schemas.js';
import { PAYROLL_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { startOfDay, endOfDay } from '@shared/utils/date.util.js';
import { ApprovalEngineService } from '@modules/approval/services/approval-engine.service.js';
import { APPROVAL_ENTITY_TYPE, APPROVAL_REQUEST_TYPE } from '@modules/approval/constants/approval.constants.js';
import { PayrollPolicyService } from '@modules/payroll/services/payroll-policy.service.js';
import { EmployeeCompensationService } from '@modules/payroll/services/employee-compensation.service.js';
import { SalaryStructureService } from '@modules/payroll/services/salary-structure.service.js';
import { PayrollCalculatorService } from '@modules/payroll/services/payroll-calculator.service.js';
import { PayrollAuditService } from '@modules/payroll/services/payroll-audit.service.js';
import { PayrollEventService, PAYROLL_NOTIFICATION_JOB } from '@modules/payroll/services/payroll-event.service.js';
import type { PayrollActorContext } from '@modules/approval/types/approval.types.js';

function buildPeriodLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export const PayrollProcessingService = {
  async list(companyId: string, query: { status?: string; year?: number; month?: number; page?: number; pageSize?: number }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.year) filter.year = query.year;
    if (query.month) filter.month = query.month;
    return PayrollRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'periodStart',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const payroll = await PayrollRepository.findById(id, { companyId });
    if (!payroll) {
      throw new NotFoundError('Payroll run not found', ERROR_CODES.NOT_FOUND);
    }
    return payroll;
  },

  async create(context: PayrollActorContext, payload: {
    year: number;
    month: number;
    departmentId?: string;
    branchId?: string;
  }) {
    const periodStart = startOfDay(new Date(payload.year, payload.month - 1, 1));
    const periodEnd = endOfDay(new Date(payload.year, payload.month, 0));
    const periodLabel = buildPeriodLabel(payload.year, payload.month);

    const existing = await PayrollRepository.findOne(
      {
        year: payload.year,
        month: payload.month,
        departmentId: payload.departmentId ?? null,
        branchId: payload.branchId ?? null,
      },
      { companyId: context.companyId },
    );
    if (existing) {
      throw new ConflictError('Payroll run already exists for this period', ERROR_CODES.CONFLICT);
    }

    const id = generateUuid();
    const created = await PayrollRepository.create(
      {
        id,
        companyId: context.companyId,
        periodStart,
        periodEnd,
        year: payload.year,
        month: payload.month,
        periodLabel,
        status: PAYROLL_STATUS.DRAFT,
        isLocked: false,
        departmentId: payload.departmentId,
        branchId: payload.branchId,
        exceptionsCount: 0,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_run',
      entityId: id,
      action: 'create',
      after: PayrollAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async processEmployee(context: PayrollActorContext, payrollId: string, employeeId: string) {
    const payroll = await this.getById(context.companyId, payrollId);
    if (payroll.isLocked) {
      throw new ConflictError('Payroll is locked', ERROR_CODES.CONFLICT);
    }

    const policies = await PayrollPolicyService.getPolicies(context.companyId);
    const compensation = await EmployeeCompensationService.getActiveForEmployee(context.companyId, employeeId, payroll.periodEnd);
    if (!compensation) {
      return { employeeId, skipped: true, reason: 'no_compensation' };
    }

    const structure = await SalaryStructureService.getById(context.companyId, compensation.salaryStructureId);

    const attendanceFilter: Record<string, unknown> = {
      employeeId,
      date: { $gte: payroll.periodStart, $lte: payroll.periodEnd },
    };
    const attendanceRecords = await AttendanceRepository.findMany(attendanceFilter, { companyId: context.companyId });
    const attendanceSummary = PayrollCalculatorService.aggregateAttendanceSnapshot(attendanceRecords);

    const result = PayrollCalculatorService.calculate({
      baseSalary: compensation.baseSalary,
      structure,
      componentOverrides: compensation.componentOverrides,
      attendanceSummary,
      policies,
    });

    return { employeeId, skipped: false, calculation: result };
  },

  async process(context: PayrollActorContext, payrollId: string, payload?: { employeeIds?: string[] }) {
    const payroll = await this.getById(context.companyId, payrollId);
    if (payroll.isLocked) {
      throw new ConflictError('Payroll is locked', ERROR_CODES.CONFLICT);
    }

    await PayrollRepository.update(
      payrollId,
      { status: PAYROLL_STATUS.PROCESSING, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    const employeeFilter: Record<string, unknown> = {};
    if (payroll.departmentId) employeeFilter.departmentId = payroll.departmentId;
    if (payroll.branchId) employeeFilter.branchId = payroll.branchId;

    let employees = await EmployeeRepository.findMany(employeeFilter, { companyId: context.companyId });
    if (payload?.employeeIds?.length) {
      const idSet = new Set(payload.employeeIds);
      employees = employees.filter((e) => idSet.has(e.id));
    }

    let totalGross = 0;
    let totalNet = 0;
    let processed = 0;
    let exceptionsCount = 0;

    for (const employee of employees) {
      const outcome = await this.processEmployee(context, payrollId, employee.id);
      if (outcome.skipped) {
        exceptionsCount++;
        continue;
      }
      totalGross += outcome.calculation!.grossSalary;
      totalNet += outcome.calculation!.netSalary;
      processed++;
    }

    const updated = await PayrollRepository.update(
      payrollId,
      {
        status: PAYROLL_STATUS.DRAFT,
        processedAt: new Date(),
        processedBy: context.userId,
        totalEmployees: processed,
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        exceptionsCount,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await PayrollEventService.publishActivity(context, {
      activityType: 'payroll_processed',
      description: `Processed payroll ${payroll.periodLabel}: ${String(processed)} employees`,
      entityType: 'payroll_run',
      entityId: payrollId,
      metadata: { processed, exceptionsCount },
    });

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_run',
      entityId: payrollId,
      action: 'process',
      after: PayrollAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { payroll: updated, processed, exceptionsCount };
  },

  async submit(context: PayrollActorContext, payrollId: string) {
    const payroll = await this.getById(context.companyId, payrollId);
    if (payroll.isLocked) {
      throw new ConflictError('Payroll is locked', ERROR_CODES.CONFLICT);
    }
    if (payroll.status === PAYROLL_STATUS.PENDING_APPROVAL) {
      throw new ConflictError('Payroll already submitted', ERROR_CODES.CONFLICT);
    }

    const policies = await PayrollPolicyService.getPolicies(context.companyId);

    const approval = await ApprovalEngineService.createRequest(context, {
      requestType: APPROVAL_REQUEST_TYPE.PAYROLL_RUN,
      entityType: APPROVAL_ENTITY_TYPE.PAYROLL_RUN,
      entityId: payrollId,
      workflowSlug: policies.approvalWorkflowSlug,
      requesterEmployeeId: context.employeeId ?? context.userId,
      title: `Payroll run — ${payroll.periodLabel}`,
      description: `Payroll approval for ${payroll.periodLabel}`,
      metadata: {
        year: payroll.year,
        month: payroll.month,
        totalEmployees: payroll.totalEmployees,
        totalNet: payroll.totalNet,
      },
    });

    await ApprovalEngineService.submitRequest(context, approval.id);

    const updated = await PayrollRepository.update(
      payrollId,
      {
        approvalRequestId: approval.id,
        status: PAYROLL_STATUS.PENDING_APPROVAL,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (context.userId) {
      await PayrollEventService.notify(context, {
        recipientUserId: context.userId,
        title: 'Payroll submitted for approval',
        body: `Payroll for ${payroll.periodLabel} submitted`,
        entityType: 'payroll_run',
        entityId: payrollId,
        jobName: PAYROLL_NOTIFICATION_JOB.RUN_SUBMITTED,
      });
    }

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_run',
      entityId: payrollId,
      action: 'update',
      after: PayrollAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async onApprovalDecision(context: PayrollActorContext, payrollId: string, approvalStatus: string) {
    const payroll = await this.getById(context.companyId, payrollId);

    if (approvalStatus === APPROVAL_REQUEST_STATUS.APPROVED) {
      const updated = await PayrollRepository.update(
        payrollId,
        {
          status: PAYROLL_STATUS.APPROVED,
          finalizedAt: new Date(),
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );

      await PayrollEventService.publishActivity(context, {
        activityType: 'payroll_approved',
        description: `Payroll approved for ${payroll.periodLabel}`,
        entityType: 'payroll_run',
        entityId: payrollId,
      });

      await PayrollAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'payroll_run',
        entityId: payrollId,
        action: 'approve',
        after: PayrollAuditService.toRecord(updated),
        ip: context.ip,
        userAgent: context.userAgent,
      });

      return updated;
    }

    if (approvalStatus === APPROVAL_REQUEST_STATUS.REJECTED) {
      const updated = await PayrollRepository.update(
        payrollId,
        {
          status: PAYROLL_STATUS.DRAFT,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );

      await PayrollAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'payroll_run',
        entityId: payrollId,
        action: 'reject',
        after: PayrollAuditService.toRecord(updated),
        ip: context.ip,
        userAgent: context.userAgent,
      });

      return updated;
    }

    return payroll;
  },
};
