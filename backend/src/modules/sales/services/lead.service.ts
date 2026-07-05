import {
  LeadRepository,
  LEAD_PRIORITY,
} from '@domain/sales/sales.schemas.js';
import { SALES_STATUS } from '@shared/constants/status.constants.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { PipelineService } from '@modules/sales/services/pipeline.service.js';
import { LeadScoringService } from '@modules/sales/services/lead-scoring.service.js';
import { LeadAssignmentService } from '@modules/sales/services/lead-assignment.service.js';
import { LeadActivityService } from '@modules/sales/services/lead-activity.service.js';
import { SalesTeamService } from '@modules/sales/services/sales-team.service.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import { LEAD_PERMISSIONS } from '@modules/sales/constants/sales-permissions.constants.js';
import { SALES_SCOPE } from '@modules/sales/constants/sales.constants.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

interface LeadListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  assignedToId?: string;
  pipelineId?: string;
  stageId?: string;
  teamId?: string;
  territoryId?: string;
  priority?: string;
  sourceId?: string;
  search?: string;
}

async function resolveScope(
  context: SalesActorContext,
  permissions: string[],
): Promise<{ scope: string; employeeIds?: string[] }> {
  const hasUpdate = permissions.includes(LEAD_PERMISSIONS.UPDATE);
  const hasRead = permissions.includes(LEAD_PERMISSIONS.READ);

  if (!hasRead) {
    return { scope: SALES_SCOPE.OWN, employeeIds: context.employeeId ? [context.employeeId] : [] };
  }

  if (hasUpdate) {
    return { scope: SALES_SCOPE.ALL };
  }

  if (context.employeeId) {
    const teamMemberIds = await SalesTeamService.getMemberIdsForManager(context.companyId, context.employeeId);
    const reporteeIds = await LeadAssignmentService.getReporteeIds(context.companyId, context.employeeId);
    const combined = [...new Set([...teamMemberIds, ...reporteeIds, context.employeeId])];

    if (combined.length > 1) {
      return { scope: SALES_SCOPE.TEAM, employeeIds: combined };
    }

    return { scope: SALES_SCOPE.OWN, employeeIds: [context.employeeId] };
  }

  return { scope: SALES_SCOPE.ALL };
}

function buildScopeFilter(scope: { scope: string; employeeIds?: string[] }): Record<string, unknown> {
  if (scope.scope === SALES_SCOPE.ALL) return {};
  if (scope.employeeIds && scope.employeeIds.length > 0) {
    return { assignedToId: { $in: scope.employeeIds } };
  }
  return { assignedToId: null };
}

export const LeadService = {
  async list(context: SalesActorContext, permissions: string[], query: LeadListQuery) {
    const scope = await resolveScope(context, permissions);
    const filter: Record<string, unknown> = { ...buildScopeFilter(scope) };

    if (query.status) filter.status = query.status;
    if (query.assignedToId) filter.assignedToId = query.assignedToId;
    if (query.pipelineId) filter.pipelineId = query.pipelineId;
    if (query.stageId) filter.stageId = query.stageId;
    if (query.teamId) filter.teamId = query.teamId;
    if (query.territoryId) filter.territoryId = query.territoryId;
    if (query.priority) filter.priority = query.priority;
    if (query.sourceId) filter.sourceId = query.sourceId;
    if (query.search) filter.$text = { $search: query.search };

    return LeadRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'lastActivityAt',
      sortOrder: 'desc',
    }, { companyId: context.companyId });
  },

  async getById(context: SalesActorContext, permissions: string[], id: string) {
    const lead = await LeadRepository.findById(id, { companyId: context.companyId });
    if (!lead) {
      throw new NotFoundError('Lead not found', ERROR_CODES.NOT_FOUND);
    }

    const scope = await resolveScope(context, permissions);
    if (scope.scope !== SALES_SCOPE.ALL && scope.employeeIds && lead.assignedToId) {
      if (!scope.employeeIds.includes(lead.assignedToId)) {
        throw new NotFoundError('Lead not found', ERROR_CODES.NOT_FOUND);
      }
    }

    return this.enrichLead(context.companyId, lead);
  },

  async enrichLead(companyId: string, lead: Awaited<ReturnType<typeof LeadRepository.findById>>) {
    if (!lead) return lead;
    let assigneeName: string | undefined;
    if (lead.assignedToId) {
      const employee = await EmployeeRepository.findById(lead.assignedToId, { companyId });
      if (employee) assigneeName = `${employee.firstName} ${employee.lastName}`.trim();
    }
    return { ...lead, assigneeName };
  },

  async create(context: SalesActorContext, payload: {
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    phone?: string;
    source?: string;
    sourceId?: string;
    estimatedValue?: number;
    dealValue?: number;
    currency?: string;
    assignedToId?: string;
    pipelineId?: string;
    stageId?: string;
    notes?: string;
    tags?: string[];
    priority?: string;
    territoryId?: string;
    teamId?: string;
    expectedCloseDate?: Date;
    internalNotes?: string;
  }) {
    await PipelineService.ensureDefaultPipeline(context);
    const defaultPipeline = await PipelineService.getDefault(context.companyId);

    const id = generateUuid();
    const leadData = {
      id,
      companyId: context.companyId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      company: payload.company,
      phone: payload.phone,
      source: payload.source,
      sourceId: payload.sourceId,
      status: SALES_STATUS.LEAD,
      estimatedValue: payload.estimatedValue,
      dealValue: payload.dealValue,
      currency: payload.currency ?? 'INR',
      assignedToId: payload.assignedToId,
      pipelineId: payload.pipelineId ?? defaultPipeline.id,
      stageId: payload.stageId ?? defaultPipeline.stages[0]?.id,
      notes: payload.notes,
      tags: payload.tags ?? [],
      priority: payload.priority ?? LEAD_PRIORITY.MEDIUM,
      territoryId: payload.territoryId,
      teamId: payload.teamId,
      expectedCloseDate: payload.expectedCloseDate,
      internalNotes: payload.internalNotes,
      attachmentUrls: [] as string[],
      score: 0,
      createdBy: context.userId,
      updatedBy: context.userId,
    };

    const created = await LeadRepository.create(leadData, { companyId: context.companyId });

    const score = await LeadScoringService.calculateScore(context.companyId, created);
    if (score !== created.score) {
      await LeadRepository.update(id, { score, updatedBy: context.userId }, { companyId: context.companyId });
      created.score = score;
    }

    if (payload.assignedToId) {
      await LeadAssignmentService.assign(context, id, {
        assignedToId: payload.assignedToId,
        teamId: payload.teamId,
        territoryId: payload.territoryId,
        reason: 'Initial assignment',
      });
    } else {
      await LeadAssignmentService.autoAssign(context, id);
    }

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead',
      entityId: id,
      action: 'create',
      after: SalesAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async update(context: SalesActorContext, permissions: string[], id: string, payload: Record<string, unknown>) {
    await this.getById(context, permissions, id);
    const before = await LeadRepository.findById(id, { companyId: context.companyId });

    const updated = await LeadRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    if (updated) {
      const score = await LeadScoringService.calculateScore(context.companyId, updated);
      if (score !== updated.score) {
        await LeadRepository.update(id, { score, updatedBy: context.userId }, { companyId: context.companyId });
        updated.score = score;
      }
    }

    if (before && payload.status && payload.status !== before.status) {
      await LeadActivityService.logStatusChange(context, id, {
        fromStatus: before.status,
        toStatus: String(payload.status),
      });
    }

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead',
      entityId: id,
      action: 'update',
      before: SalesAuditService.toRecord(before),
      after: SalesAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async delete(context: SalesActorContext, permissions: string[], id: string) {
    await this.getById(context, permissions, id);
    const before = await LeadRepository.findById(id, { companyId: context.companyId });
    await LeadRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },

  async moveStage(context: SalesActorContext, permissions: string[], leadId: string, payload: {
    stageId: string;
    pipelineId?: string;
    wonReason?: string;
    lostReason?: string;
  }) {
    const lead = await this.getById(context, permissions, leadId);
    if (!lead) {
      throw new NotFoundError('Lead not found', ERROR_CODES.NOT_FOUND);
    }

    const pipelineId = payload.pipelineId ?? lead.pipelineId;
    const pipeline = pipelineId
      ? await PipelineService.getById(context.companyId, pipelineId)
      : await PipelineService.getDefault(context.companyId);

    const stage = pipeline.stages.find((s) => s.id === payload.stageId);
    if (!stage) {
      throw new NotFoundError('Stage not found in pipeline', ERROR_CODES.NOT_FOUND);
    }

    let status = lead.status;
    if (stage.id === 'won') status = SALES_STATUS.WON;
    if (stage.id === 'lost') status = SALES_STATUS.LOST;
    if (stage.id === 'qualified') status = SALES_STATUS.QUALIFIED;
    if (stage.id === 'proposal') status = SALES_STATUS.PROPOSAL;

    const updated = await LeadRepository.update(
      leadId,
      {
        stageId: payload.stageId,
        pipelineId: pipeline.id,
        status,
        wonReason: payload.wonReason ?? lead.wonReason,
        lostReason: payload.lostReason ?? lead.lostReason,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await LeadActivityService.logPipelineMove(context, leadId, {
      fromStageId: lead.stageId,
      toStageId: payload.stageId,
      pipelineId: pipeline.id,
    });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead',
      entityId: leadId,
      action: 'move',
      before: SalesAuditService.toRecord(lead),
      after: SalesAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async importCsv(context: SalesActorContext, csvContent: string) {
    const lines = csvContent.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return { imported: 0, errors: [] as string[] };

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const errors: string[] = [];
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

      try {
        if (!row.email || !row.firstname) {
          errors.push(`Row ${i + 1}: missing required fields`);
          continue;
        }
        await this.create(context, {
          firstName: row.firstname ?? row['first name'] ?? '',
          lastName: row.lastname ?? row['last name'] ?? '',
          email: row.email,
          phone: row.phone,
          company: row.company,
          source: row.source,
          estimatedValue: row.estimatedvalue ? Number(row.estimatedvalue) : undefined,
        });
        imported++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead_import',
      entityId: context.companyId,
      action: 'import',
      after: { imported, errorCount: errors.length },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { imported, errors };
  },

  async exportCsv(context: SalesActorContext, permissions: string[]): Promise<string> {
    const result = await this.list(context, permissions, { page: 1, pageSize: 10000 });
    const headers = ['id', 'firstName', 'lastName', 'email', 'phone', 'company', 'status', 'assignedToId', 'stageId', 'score', 'dealValue', 'priority'];
    const lines = [headers.join(',')];

    for (const lead of result.items) {
      lines.push(headers.map((h) => String((lead as unknown as Record<string, unknown>)[h] ?? '')).join(','));
    }

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead_export',
      entityId: context.companyId,
      action: 'export',
      after: { count: result.items.length },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return lines.join('\n');
  },

  async listMine(context: SalesActorContext, permissions: string[], query: LeadListQuery) {
    if (!context.employeeId) {
      return LeadRepository.paginate(
        { assignedToId: null },
        { page: query.page, pageSize: query.pageSize, sortBy: 'lastActivityAt', sortOrder: 'desc' },
        { companyId: context.companyId },
      );
    }
    return this.list(context, permissions, { ...query, assignedToId: context.employeeId });
  },

  async listTeam(context: SalesActorContext, permissions: string[], query: LeadListQuery) {
    const scope = await resolveScope(context, permissions);
    const employeeIds =
      scope.scope === SALES_SCOPE.ALL
        ? undefined
        : scope.employeeIds && scope.employeeIds.length > 0
          ? scope.employeeIds
          : context.employeeId
            ? [context.employeeId]
            : [];

    const filter: Record<string, unknown> = {};
    if (employeeIds !== undefined) {
      filter.assignedToId = employeeIds.length > 0 ? { $in: employeeIds } : null;
    }
    if (query.status) filter.status = query.status;
    if (query.pipelineId) filter.pipelineId = query.pipelineId;
    if (query.stageId) filter.stageId = query.stageId;
    if (query.teamId) filter.teamId = query.teamId;
    if (query.territoryId) filter.territoryId = query.territoryId;
    if (query.priority) filter.priority = query.priority;
    if (query.sourceId) filter.sourceId = query.sourceId;
    if (query.search) filter.$text = { $search: query.search };

    return LeadRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'lastActivityAt',
      sortOrder: 'desc',
    }, { companyId: context.companyId });
  },

  async getKanban(
    context: SalesActorContext,
    permissions: string[],
    pipelineId?: string,
  ) {
    const pipeline = pipelineId
      ? await PipelineService.getById(context.companyId, pipelineId)
      : await PipelineService.getDefault(context.companyId);

    const scope = await resolveScope(context, permissions);
    const filter: Record<string, unknown> = {
      pipelineId: pipeline.id,
      ...buildScopeFilter(scope),
    };

    const leads = await LeadRepository.findMany(filter, { companyId: context.companyId });
    const enriched = await Promise.all(
      leads.map((lead) => this.enrichLead(context.companyId, lead)),
    );

    const columns = [...pipeline.stages]
      .sort((a, b) => a.order - b.order)
      .map((stage) => ({
        stageId: stage.id,
        stageName: stage.name,
        order: stage.order,
        leads: enriched.filter((lead) => lead?.stageId === stage.id),
      }));

    return {
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      columns,
    };
  },
};
