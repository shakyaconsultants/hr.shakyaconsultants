import {
  SALARY_REVISION_STATUS,
  SalaryRevisionRepository,
} from '@domain/payroll/payroll.schemas.js';
import { APPROVAL_REQUEST_STATUS } from '@domain/approval/approval.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ApprovalEngineService } from '@modules/approval/services/approval-engine.service.js';
import { APPROVAL_ENTITY_TYPE, APPROVAL_REQUEST_TYPE } from '@modules/approval/constants/approval.constants.js';
import { PayrollPolicyService } from '@modules/payroll/services/payroll-policy.service.js';
import { EmployeeCompensationService } from '@modules/payroll/services/employee-compensation.service.js';
import { PayrollAuditService } from '@modules/payroll/services/payroll-audit.service.js';
import { PayrollEventService, PAYROLL_NOTIFICATION_JOB } from '@modules/payroll/services/payroll-event.service.js';
import type { PayrollActorContext } from '@modules/approval/types/approval.types.js';

export const SalaryRevisionService = {
  async list(companyId: string, query: { employeeId?: string; status?: string; page?: number; pageSize?: number }) {
    const filter: Record<string, unknown> = {};
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.status) filter.status = query.status;
    return SalaryRevisionRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'effectiveFrom',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const revision = await SalaryRevisionRepository.findById(id, { companyId });
    if (!revision) {
      throw new NotFoundError('Salary revision not found', ERROR_CODES.NOT_FOUND);
    }
    return revision;
  },

  async getNextVersion(companyId: string, employeeId: string): Promise<number> {
    const result = await SalaryRevisionRepository.paginate(
      { employeeId },
      { page: 1, pageSize: 1, sortBy: 'version', sortOrder: 'desc' },
      { companyId },
    );
    return (result.items[0]?.version ?? 0) + 1;
  },

  async create(context: PayrollActorContext, payload: {
    employeeId: string;
    revisionType: string;
    salaryStructureId?: string;
    newBaseSalary: number;
    effectiveFrom: Date;
    reason: string;
    submit?: boolean;
  }) {
    const employee = await EmployeeRepository.findById(payload.employeeId, { companyId: context.companyId });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    const activeCompensation = await EmployeeCompensationService.getActiveForEmployee(context.companyId, payload.employeeId);
    const previousSalary = activeCompensation?.baseSalary ?? 0;
    const previousStructureId = activeCompensation?.salaryStructureId;
    const version = await this.getNextVersion(context.companyId, payload.employeeId);
    const id = generateUuid();

    const revision = await SalaryRevisionRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId: payload.employeeId,
        revisionType: payload.revisionType,
        status: SALARY_REVISION_STATUS.DRAFT,
        salaryStructureId: payload.salaryStructureId ?? previousStructureId,
        previousStructureId,
        previousSalary,
        newSalary: payload.newBaseSalary,
        newBaseSalary: payload.newBaseSalary,
        effectiveFrom: payload.effectiveFrom,
        reason: payload.reason,
        version,
        timeline: [{
          status: SALARY_REVISION_STATUS.DRAFT,
          changedAt: new Date(),
          changedBy: context.userId,
          note: 'Revision created',
        }],
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (payload.submit !== false) {
      return this.submit(context, id);
    }

    return revision;
  },

  async submit(context: PayrollActorContext, revisionId: string) {
    const revision = await this.getById(context.companyId, revisionId);
    if (revision.status !== SALARY_REVISION_STATUS.DRAFT) {
      throw new ConflictError('Salary revision already submitted', ERROR_CODES.CONFLICT);
    }

    const policies = await PayrollPolicyService.getPolicies(context.companyId);

    const approval = await ApprovalEngineService.createRequest(context, {
      requestType: APPROVAL_REQUEST_TYPE.SALARY_REVISION,
      entityType: APPROVAL_ENTITY_TYPE.SALARY_REVISION,
      entityId: revisionId,
      workflowSlug: policies.revisionWorkflowSlug,
      requesterEmployeeId: revision.employeeId,
      title: 'Salary revision request',
      description: revision.reason,
      metadata: {
        employeeId: revision.employeeId,
        previousSalary: revision.previousSalary,
        newBaseSalary: revision.newBaseSalary,
        revisionType: revision.revisionType,
      },
    });

    await ApprovalEngineService.submitRequest(context, approval.id);

    const timeline = [
      ...revision.timeline,
      {
        status: SALARY_REVISION_STATUS.PENDING,
        changedAt: new Date(),
        changedBy: context.userId,
        note: 'Submitted for approval',
      },
    ];

    const updated = await SalaryRevisionRepository.update(
      revisionId,
      {
        approvalRequestId: approval.id,
        status: SALARY_REVISION_STATUS.PENDING,
        timeline,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    const employee = await EmployeeRepository.findById(revision.employeeId, { companyId: context.companyId });
    if (employee?.userId) {
      await PayrollEventService.notify(context, {
        recipientUserId: employee.userId,
        title: 'Salary revision submitted',
        body: revision.reason,
        entityType: 'salary_revision',
        entityId: revisionId,
        jobName: PAYROLL_NOTIFICATION_JOB.REVISION_SUBMITTED,
      });
    }

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'salary_revision',
      entityId: revisionId,
      action: 'update',
      after: PayrollAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async onApprovalDecision(context: PayrollActorContext, revisionId: string, approvalStatus: string) {
    const revision = await this.getById(context.companyId, revisionId);

    if (approvalStatus === APPROVAL_REQUEST_STATUS.APPROVED) {
      const activeRevisions = await SalaryRevisionRepository.findMany(
        { employeeId: revision.employeeId, status: SALARY_REVISION_STATUS.ACTIVE },
        { companyId: context.companyId },
      );
      for (const active of activeRevisions) {
        await SalaryRevisionRepository.update(
          active.id,
          {
            status: SALARY_REVISION_STATUS.SUPERSEDED,
            timeline: [
              ...active.timeline,
              { status: SALARY_REVISION_STATUS.SUPERSEDED, changedAt: new Date(), changedBy: context.userId, note: 'Superseded by new revision' },
            ],
            updatedBy: context.userId,
          },
          { companyId: context.companyId },
        );
      }

      if (revision.salaryStructureId) {
        await EmployeeCompensationService.assign(context, {
          employeeId: revision.employeeId,
          salaryStructureId: revision.salaryStructureId,
          baseSalary: revision.newBaseSalary,
          effectiveFrom: revision.effectiveFrom,
        });
      }

      const timeline = [
        ...revision.timeline,
        { status: SALARY_REVISION_STATUS.APPROVED, changedAt: new Date(), changedBy: context.userId, note: 'Approved' },
        { status: SALARY_REVISION_STATUS.ACTIVE, changedAt: new Date(), changedBy: context.userId, note: 'Applied' },
      ];

      const updated = await SalaryRevisionRepository.update(
        revisionId,
        {
          status: SALARY_REVISION_STATUS.ACTIVE,
          approvedBy: context.userId,
          approvedAt: new Date(),
          timeline,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );

      await PayrollEventService.publishActivity(context, {
        activityType: 'salary_revision_approved',
        description: `Salary revision approved for employee ${revision.employeeId}`,
        entityType: 'salary_revision',
        entityId: revisionId,
      });

      await PayrollAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'salary_revision',
        entityId: revisionId,
        action: 'approve',
        after: PayrollAuditService.toRecord(updated),
        ip: context.ip,
        userAgent: context.userAgent,
      });

      return updated;
    }

    if (approvalStatus === APPROVAL_REQUEST_STATUS.REJECTED) {
      const timeline = [
        ...revision.timeline,
        { status: SALARY_REVISION_STATUS.REJECTED, changedAt: new Date(), changedBy: context.userId, note: 'Rejected' },
      ];

      const updated = await SalaryRevisionRepository.update(
        revisionId,
        {
          status: SALARY_REVISION_STATUS.REJECTED,
          timeline,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );

      await PayrollAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'salary_revision',
        entityId: revisionId,
        action: 'reject',
        after: PayrollAuditService.toRecord(updated),
        ip: context.ip,
        userAgent: context.userAgent,
      });

      return updated;
    }

    return revision;
  },

  async update(context: PayrollActorContext, id: string, payload: {
    revisionType?: string;
    salaryStructureId?: string;
    newBaseSalary?: number;
    effectiveFrom?: Date;
    reason?: string;
  }) {
    const existing = await this.getById(context.companyId, id);
    if (existing.status !== SALARY_REVISION_STATUS.DRAFT) {
      throw new ConflictError('Only draft revisions can be updated', ERROR_CODES.CONFLICT);
    }

    const version = await this.getNextVersion(context.companyId, existing.employeeId);
    const newId = generateUuid();

    const created = await SalaryRevisionRepository.create(
      {
        id: newId,
        companyId: context.companyId,
        employeeId: existing.employeeId,
        revisionType: payload.revisionType ?? existing.revisionType,
        status: SALARY_REVISION_STATUS.DRAFT,
        salaryStructureId: payload.salaryStructureId ?? existing.salaryStructureId,
        previousStructureId: existing.previousStructureId,
        previousSalary: existing.previousSalary,
        newSalary: payload.newBaseSalary ?? existing.newBaseSalary,
        newBaseSalary: payload.newBaseSalary ?? existing.newBaseSalary,
        effectiveFrom: payload.effectiveFrom ?? existing.effectiveFrom,
        reason: payload.reason ?? existing.reason,
        version,
        timeline: [{
          status: SALARY_REVISION_STATUS.DRAFT,
          changedAt: new Date(),
          changedBy: context.userId,
          note: `New version ${String(version)} from ${existing.id}`,
        }],
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await SalaryRevisionRepository.update(
      existing.id,
      {
        status: SALARY_REVISION_STATUS.SUPERSEDED,
        timeline: [
          ...existing.timeline,
          { status: SALARY_REVISION_STATUS.SUPERSEDED, changedAt: new Date(), changedBy: context.userId, note: `Superseded by version ${String(version)}` },
        ],
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    return created;
  },
};
