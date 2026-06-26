import { SalaryStructureRepository } from '@domain/payroll/payroll.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { PayrollAuditService } from '@modules/payroll/services/payroll-audit.service.js';
import type { PayrollActorContext } from '@modules/approval/types/approval.types.js';

export const SalaryStructureService = {
  async list(companyId: string, query: { status?: string; page?: number; pageSize?: number }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    return SalaryStructureRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'name',
      sortOrder: 'asc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const structure = await SalaryStructureRepository.findById(id, { companyId });
    if (!structure) {
      throw new NotFoundError('Salary structure not found', ERROR_CODES.NOT_FOUND);
    }
    return structure;
  },

  async create(context: PayrollActorContext, payload: {
    name: string;
    code: string;
    baseSalary: number;
    currency?: string;
    components?: Array<{ name: string; code: string; type: string; category?: string; amount: number; isTaxable: boolean }>;
  }) {
    const id = generateUuid();
    const created = await SalaryStructureRepository.create(
      {
        id,
        companyId: context.companyId,
        name: payload.name,
        code: payload.code.toUpperCase(),
        baseSalary: payload.baseSalary,
        currency: payload.currency ?? 'INR',
        components: payload.components ?? [],
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'salary_structure',
      entityId: id,
      action: 'create',
      after: PayrollAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async update(context: PayrollActorContext, id: string, payload: {
    name?: string;
    baseSalary?: number;
    currency?: string;
    components?: Array<{ name: string; code: string; type: string; category?: string; amount: number; isTaxable: boolean }>;
    status?: string;
  }) {
    const before = await this.getById(context.companyId, id);
    const updated = await SalaryStructureRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'salary_structure',
      entityId: id,
      action: 'update',
      before: PayrollAuditService.toRecord(before),
      after: PayrollAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async delete(context: PayrollActorContext, id: string) {
    const before = await this.getById(context.companyId, id);
    await SalaryStructureRepository.update(
      id,
      { status: ENTITY_STATUS.DELETED, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'salary_structure',
      entityId: id,
      action: 'delete',
      before: PayrollAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
