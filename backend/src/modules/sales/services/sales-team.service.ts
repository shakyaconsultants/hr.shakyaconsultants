import { SalesTeamRepository } from '@domain/sales/sales.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const SalesTeamService = {
  async list(companyId: string, query: { status?: string; page?: number; pageSize?: number; managerEmployeeId?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.managerEmployeeId) filter.managerEmployeeId = query.managerEmployeeId;
    return SalesTeamRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'name',
      sortOrder: 'asc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const team = await SalesTeamRepository.findById(id, { companyId });
    if (!team) {
      throw new NotFoundError('Sales team not found', ERROR_CODES.NOT_FOUND);
    }
    return team;
  },

  async getMemberIdsForManager(companyId: string, managerEmployeeId: string): Promise<string[]> {
    const teams = await SalesTeamRepository.findMany(
      { managerEmployeeId, status: ENTITY_STATUS.ACTIVE },
      { companyId },
    );
    const memberIds = new Set<string>();
    for (const team of teams) {
      memberIds.add(team.managerEmployeeId);
      for (const id of team.memberEmployeeIds) {
        memberIds.add(id);
      }
    }
    return [...memberIds];
  },

  async enrichWithNames(companyId: string, team: Awaited<ReturnType<typeof SalesTeamRepository.findById>>) {
    if (!team) return team;
    const employeeIds = [team.managerEmployeeId, ...team.memberEmployeeIds];
    const employees = await EmployeeRepository.findMany({ id: { $in: employeeIds } }, { companyId });
    const nameMap = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`.trim()]));
    return {
      ...team,
      managerName: nameMap.get(team.managerEmployeeId),
      memberNames: team.memberEmployeeIds.map((id) => ({ id, name: nameMap.get(id) })),
    };
  },

  async create(context: SalesActorContext, payload: {
    name: string;
    code: string;
    managerEmployeeId: string;
    memberEmployeeIds?: string[];
    territoryId?: string;
  }) {
    const id = generateUuid();
    const created = await SalesTeamRepository.create(
      {
        id,
        companyId: context.companyId,
        name: payload.name,
        code: payload.code.toUpperCase(),
        managerEmployeeId: payload.managerEmployeeId,
        memberEmployeeIds: payload.memberEmployeeIds ?? [],
        territoryId: payload.territoryId,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sales_team',
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
    managerEmployeeId?: string;
    memberEmployeeIds?: string[];
    territoryId?: string;
    status?: string;
  }) {
    const before = await this.getById(context.companyId, id);
    const updated = await SalesTeamRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sales_team',
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
    await SalesTeamRepository.update(id, { status: ENTITY_STATUS.INACTIVE, updatedBy: context.userId }, { companyId: context.companyId });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sales_team',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
