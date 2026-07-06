import {
  EMPLOYEE_COMPENSATION_STATUS,
  EmployeeCompensationRepository,
} from '@domain/payroll/payroll.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SalaryStructureService } from '@modules/payroll/services/salary-structure.service.js';
import { PayrollAuditService } from '@modules/payroll/services/payroll-audit.service.js';
import type { PayrollActorContext } from '@modules/approval/types/approval.types.js';

export const EmployeeCompensationService = {
  async list(
    companyId: string,
    query: { employeeId?: string; status?: string; page?: number; pageSize?: number },
  ) {
    const filter: Record<string, unknown> = {};
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.status) filter.status = query.status;
    return EmployeeCompensationRepository.paginate(
      filter,
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'effectiveFrom',
        sortOrder: 'desc',
      },
      { companyId },
    );
  },

  async getById(companyId: string, id: string) {
    const compensation = await EmployeeCompensationRepository.findById(id, { companyId });
    if (!compensation) {
      throw new NotFoundError('Employee compensation not found', ERROR_CODES.NOT_FOUND);
    }
    return compensation;
  },

  async getActiveForEmployee(companyId: string, employeeId: string, asOf?: Date) {
    const date = asOf ?? new Date();
    const result = await EmployeeCompensationRepository.paginate(
      {
        employeeId,
        status: EMPLOYEE_COMPENSATION_STATUS.ACTIVE,
        effectiveFrom: { $lte: date },
        $or: [
          { effectiveTo: { $exists: false } },
          { effectiveTo: null },
          { effectiveTo: { $gte: date } },
        ],
      },
      { page: 1, pageSize: 1, sortBy: 'effectiveFrom', sortOrder: 'desc' },
      { companyId },
    );
    if (result.items.length === 0) {
      return null;
    }
    return result.items[0];
  },

  async getSalaryHistory(companyId: string, employeeId: string) {
    const result = await EmployeeCompensationRepository.paginate(
      { employeeId },
      { page: 1, pageSize: 100, sortBy: 'effectiveFrom', sortOrder: 'desc' },
      { companyId },
    );
    return result.items;
  },

  async getMyCompensation(companyId: string, employeeId: string) {
    const active = await this.getActiveForEmployee(companyId, employeeId);
    if (!active) {
      return null;
    }
    const structure = await SalaryStructureService.getById(companyId, active.salaryStructureId);
    return { ...active, salaryStructure: structure };
  },

  /** Active compensation with populated company salary structure (admin employee profile). */
  async getActiveWithStructure(companyId: string, employeeId: string) {
    return this.getMyCompensation(companyId, employeeId);
  },

  async assign(
    context: PayrollActorContext,
    payload: {
      employeeId: string;
      salaryStructureId: string;
      baseSalary: number;
      currency?: string;
      effectiveFrom: Date;
      componentOverrides?: Array<{ code: string; amount: number; type?: string }>;
    },
  ) {
    await SalaryStructureService.getById(context.companyId, payload.salaryStructureId);

    const active = await this.getActiveForEmployee(context.companyId, payload.employeeId);
    if (active) {
      await EmployeeCompensationRepository.update(
        active.id,
        {
          status: EMPLOYEE_COMPENSATION_STATUS.SUPERSEDED,
          effectiveTo: new Date(payload.effectiveFrom.getTime() - 1),
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );
    }

    const id = generateUuid();
    const created = await EmployeeCompensationRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId: payload.employeeId,
        salaryStructureId: payload.salaryStructureId,
        baseSalary: payload.baseSalary,
        currency: payload.currency ?? 'INR',
        effectiveFrom: payload.effectiveFrom,
        componentOverrides: payload.componentOverrides ?? [],
        status: EMPLOYEE_COMPENSATION_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'employee_compensation',
      entityId: id,
      action: 'create',
      after: PayrollAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async update(
    context: PayrollActorContext,
    id: string,
    payload: {
      baseSalary?: number;
      currency?: string;
      componentOverrides?: Array<{ code: string; amount: number; type?: string }>;
      status?: string;
    },
  ) {
    const before = await this.getById(context.companyId, id);
    const updated = await EmployeeCompensationRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'employee_compensation',
      entityId: id,
      action: 'update',
      before: PayrollAuditService.toRecord(before),
      after: PayrollAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },
};
