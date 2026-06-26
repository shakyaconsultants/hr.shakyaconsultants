import {
  AllowanceRepository,
  DeductionRepository,
  PAYROLL_COMPONENT_CATEGORY,
} from '@domain/payroll/payroll.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { PAYROLL_COMPONENT_KIND } from '@modules/payroll/constants/payroll.constants.js';
import { PayrollAuditService } from '@modules/payroll/services/payroll-audit.service.js';
import type { PayrollActorContext } from '@modules/approval/types/approval.types.js';

export interface UnifiedPayrollComponent {
  id: string;
  kind: string;
  name: string;
  code: string;
  amount: number;
  type: string;
  category: string;
  isTaxable?: boolean;
  isStatutory?: boolean;
  status: string;
}

function mapAllowance(a: Awaited<ReturnType<typeof AllowanceRepository.findById>>): UnifiedPayrollComponent | null {
  if (!a) return null;
  return {
    id: a.id,
    kind: PAYROLL_COMPONENT_KIND.ALLOWANCE,
    name: a.name,
    code: a.code,
    amount: a.amount,
    type: a.type,
    category: a.category ?? PAYROLL_COMPONENT_CATEGORY.ALLOWANCE,
    isTaxable: a.isTaxable,
    status: a.status,
  };
}

function mapDeduction(d: Awaited<ReturnType<typeof DeductionRepository.findById>>): UnifiedPayrollComponent | null {
  if (!d) return null;
  return {
    id: d.id,
    kind: PAYROLL_COMPONENT_KIND.DEDUCTION,
    name: d.name,
    code: d.code,
    amount: d.amount,
    type: d.type,
    category: d.category ?? PAYROLL_COMPONENT_CATEGORY.DEDUCTION,
    isStatutory: d.isStatutory,
    status: d.status,
  };
}

export const PayrollComponentService = {
  async list(companyId: string, query: { category?: string; status?: string; kind?: string }) {
    const [allowances, deductions] = await Promise.all([
      AllowanceRepository.findMany(
        { ...(query.status ? { status: query.status } : {}), ...(query.category ? { category: query.category } : {}) },
        { companyId },
      ),
      DeductionRepository.findMany(
        { ...(query.status ? { status: query.status } : {}), ...(query.category ? { category: query.category } : {}) },
        { companyId },
      ),
    ]);

    let items: UnifiedPayrollComponent[] = [
      ...allowances.map((a) => mapAllowance(a)!),
      ...deductions.map((d) => mapDeduction(d)!),
    ];

    if (query.kind === PAYROLL_COMPONENT_KIND.ALLOWANCE) {
      items = items.filter((i) => i.kind === PAYROLL_COMPONENT_KIND.ALLOWANCE);
    }
    if (query.kind === PAYROLL_COMPONENT_KIND.DEDUCTION) {
      items = items.filter((i) => i.kind === PAYROLL_COMPONENT_KIND.DEDUCTION);
    }

    return items.sort((a, b) => a.code.localeCompare(b.code));
  },

  async getById(companyId: string, id: string, kind?: string): Promise<UnifiedPayrollComponent> {
    if (kind !== PAYROLL_COMPONENT_KIND.DEDUCTION) {
      const allowance = await AllowanceRepository.findById(id, { companyId });
      if (allowance) return mapAllowance(allowance)!;
    }
    if (kind !== PAYROLL_COMPONENT_KIND.ALLOWANCE) {
      const deduction = await DeductionRepository.findById(id, { companyId });
      if (deduction) return mapDeduction(deduction)!;
    }
    throw new NotFoundError('Payroll component not found', ERROR_CODES.NOT_FOUND);
  },

  async create(context: PayrollActorContext, payload: {
    kind: string;
    name: string;
    code: string;
    amount: number;
    type: string;
    category?: string;
    isTaxable?: boolean;
    isStatutory?: boolean;
  }) {
    const id = generateUuid();
    const base = {
      id,
      companyId: context.companyId,
      name: payload.name,
      code: payload.code.toUpperCase(),
      amount: payload.amount,
      type: payload.type,
      category: payload.category,
      status: ENTITY_STATUS.ACTIVE,
      createdBy: context.userId,
      updatedBy: context.userId,
    };

    if (payload.kind === PAYROLL_COMPONENT_KIND.DEDUCTION) {
      const created = await DeductionRepository.create(
        {
          ...base,
          category: payload.category ?? PAYROLL_COMPONENT_CATEGORY.DEDUCTION,
          isStatutory: payload.isStatutory ?? false,
        },
        { companyId: context.companyId },
      );
      await PayrollAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'payroll_component',
        entityId: id,
        action: 'create',
        after: PayrollAuditService.toRecord(created),
        ip: context.ip,
        userAgent: context.userAgent,
      });
      return mapDeduction(created)!;
    }

    const created = await AllowanceRepository.create(
      {
        ...base,
        category: payload.category ?? PAYROLL_COMPONENT_CATEGORY.ALLOWANCE,
        isTaxable: payload.isTaxable ?? true,
      },
      { companyId: context.companyId },
    );
    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_component',
      entityId: id,
      action: 'create',
      after: PayrollAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return mapAllowance(created)!;
  },

  async update(context: PayrollActorContext, id: string, payload: {
    kind?: string;
    name?: string;
    amount?: number;
    type?: string;
    category?: string;
    isTaxable?: boolean;
    isStatutory?: boolean;
    status?: string;
  }) {
    const existing = await this.getById(context.companyId, id, payload.kind);
    const repo = existing.kind === PAYROLL_COMPONENT_KIND.DEDUCTION ? DeductionRepository : AllowanceRepository;
    const before = await repo.findById(id, { companyId: context.companyId });
    const updated = await repo.update(id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_component',
      entityId: id,
      action: 'update',
      before: PayrollAuditService.toRecord(before),
      after: PayrollAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    if (existing.kind === PAYROLL_COMPONENT_KIND.DEDUCTION) {
      return mapDeduction(updated as Awaited<ReturnType<typeof DeductionRepository.findById>>)!;
    }
    return mapAllowance(updated as Awaited<ReturnType<typeof AllowanceRepository.findById>>)!;
  },

  async delete(context: PayrollActorContext, id: string, kind?: string) {
    const existing = await this.getById(context.companyId, id, kind);
    const repo = existing.kind === PAYROLL_COMPONENT_KIND.DEDUCTION ? DeductionRepository : AllowanceRepository;
    const before = await repo.findById(id, { companyId: context.companyId });
    await repo.update(id, { status: ENTITY_STATUS.DELETED, updatedBy: context.userId }, { companyId: context.companyId });

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_component',
      entityId: id,
      action: 'delete',
      before: PayrollAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
