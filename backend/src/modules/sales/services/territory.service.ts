import { TerritoryRepository } from '@domain/sales/sales.schemas.js';
import { BranchRepository } from '@domain/organization/organization.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const TerritoryService = {
  async list(companyId: string, query: { status?: string; page?: number; pageSize?: number; branchId?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.branchId) filter.branchId = query.branchId;
    return TerritoryRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'name',
      sortOrder: 'asc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const territory = await TerritoryRepository.findById(id, { companyId });
    if (!territory) {
      throw new NotFoundError('Territory not found', ERROR_CODES.NOT_FOUND);
    }
    return territory;
  },

  async enrich(companyId: string, territory: Awaited<ReturnType<typeof TerritoryRepository.findById>>) {
    if (!territory) return territory;
    const branch = territory.branchId
      ? await BranchRepository.findById(territory.branchId, { companyId })
      : null;
    const employees = territory.assignedEmployeeIds.length > 0
      ? await EmployeeRepository.findMany({ id: { $in: territory.assignedEmployeeIds } }, { companyId })
      : [];
    const nameMap = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`.trim()]));
    return {
      ...territory,
      branchName: branch?.name,
      assignees: territory.assignedEmployeeIds.map((id) => ({ id, name: nameMap.get(id) })),
    };
  },

  async create(context: SalesActorContext, payload: {
    name: string;
    code: string;
    branchId?: string;
    region?: string;
    assignedEmployeeIds?: string[];
  }) {
    const id = generateUuid();
    const created = await TerritoryRepository.create(
      {
        id,
        companyId: context.companyId,
        name: payload.name,
        code: payload.code.toUpperCase(),
        branchId: payload.branchId,
        region: payload.region,
        assignedEmployeeIds: payload.assignedEmployeeIds ?? [],
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'territory',
      entityId: id,
      action: 'create',
      after: SalesAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async update(context: SalesActorContext, id: string, payload: {
    name?: string;
    branchId?: string;
    region?: string;
    assignedEmployeeIds?: string[];
    status?: string;
  }) {
    const before = await this.getById(context.companyId, id);
    const updated = await TerritoryRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'territory',
      entityId: id,
      action: 'update',
      before: SalesAuditService.toRecord(before),
      after: SalesAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async delete(context: SalesActorContext, id: string) {
    const before = await this.getById(context.companyId, id);
    await TerritoryRepository.update(id, { status: ENTITY_STATUS.INACTIVE, updatedBy: context.userId }, { companyId: context.companyId });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'territory',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
