import {
  LeadRepository,
  LeadAssignmentRepository,
  LEAD_ASSIGNMENT_TYPE,
} from '@domain/sales/sales.schemas.js';
import { ReportingHierarchyRepository } from '@domain/employee/employee.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SalesTeamService } from '@modules/sales/services/sales-team.service.js';
import { TerritoryService } from '@modules/sales/services/territory.service.js';
import { SalesPolicyService } from '@modules/sales/services/sales-policy.service.js';
import { LeadActivityService } from '@modules/sales/services/lead-activity.service.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const LeadAssignmentService = {
  async assign(context: SalesActorContext, leadId: string, payload: {
    assignedToId: string;
    assignmentType?: string;
    reason?: string;
    teamId?: string;
    territoryId?: string;
  }) {
    const lead = await LeadRepository.findById(leadId, { companyId: context.companyId });
    if (!lead) {
      throw new NotFoundError('Lead not found', ERROR_CODES.NOT_FOUND);
    }

    const assignmentType = payload.assignmentType ?? LEAD_ASSIGNMENT_TYPE.MANUAL;
    const now = new Date();

    const activeAssignments = await LeadAssignmentRepository.findMany(
      { leadId, isActive: true },
      { companyId: context.companyId },
    );

    for (const assignment of activeAssignments) {
      await LeadAssignmentRepository.update(
        assignment.id,
        { isActive: false, unassignedAt: now, updatedBy: context.userId },
        { companyId: context.companyId },
      );
    }

    const assignmentId = generateUuid();
    const assignment = await LeadAssignmentRepository.create(
      {
        id: assignmentId,
        companyId: context.companyId,
        leadId,
        assignedToId: payload.assignedToId,
        assignedBy: context.employeeId ?? context.userId,
        assignedAt: now,
        isActive: true,
        assignmentType,
        reason: payload.reason,
        teamId: payload.teamId,
        territoryId: payload.territoryId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    const updatedLead = await LeadRepository.update(
      leadId,
      {
        assignedToId: payload.assignedToId,
        teamId: payload.teamId ?? lead.teamId,
        territoryId: payload.territoryId ?? lead.territoryId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await LeadActivityService.logAssignment(context, leadId, {
      assignedToId: payload.assignedToId,
      assignmentType,
      reason: payload.reason,
    });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead_assignment',
      entityId: assignmentId,
      action: 'assign',
      after: SalesAuditService.toRecord(assignment),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { lead: updatedLead, assignment };
  },

  async autoAssign(context: SalesActorContext, leadId: string) {
    const policies = await SalesPolicyService.getPolicies(context.companyId);
    if (!policies.assignmentRules.autoAssignEnabled) {
      return null;
    }

    const lead = await LeadRepository.findById(leadId, { companyId: context.companyId });
    if (!lead) {
      throw new NotFoundError('Lead not found', ERROR_CODES.NOT_FOUND);
    }

    let assigneeId: string | undefined;
    let territoryId: string | undefined;
    let teamId: string | undefined;

    if (policies.assignmentRules.territoryBased && lead.territoryId) {
      const territory = await TerritoryService.getById(context.companyId, lead.territoryId);
      assigneeId = territory.assignedEmployeeIds[0];
      territoryId = territory.id;
    }

    if (!assigneeId && policies.assignmentRules.defaultTeamId) {
      const team = await SalesTeamService.getById(context.companyId, policies.assignmentRules.defaultTeamId);
      teamId = team.id;
      const members = team.memberEmployeeIds;
      if (members.length > 0) {
        if (policies.assignmentRules.roundRobin) {
          const recent = await LeadAssignmentRepository.findMany(
            { teamId: team.id, isActive: true },
            { companyId: context.companyId },
          );
          const lastAssignee = recent.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime())[0];
          const lastIndex = lastAssignee ? members.indexOf(lastAssignee.assignedToId) : -1;
          assigneeId = members[(lastIndex + 1) % members.length];
        } else {
          assigneeId = members[0];
        }
      } else {
        assigneeId = team.managerEmployeeId;
      }
    }

    if (!assigneeId) return null;

    return this.assign(context, leadId, {
      assignedToId: assigneeId,
      assignmentType: LEAD_ASSIGNMENT_TYPE.AUTOMATIC,
      teamId,
      territoryId,
      reason: 'Auto-assigned by policy',
    });
  },

  async getAssignmentHistory(companyId: string, leadId: string) {
    const assignments = await LeadAssignmentRepository.findMany({ leadId }, { companyId });
    return assignments.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
  },

  async getReporteeIds(companyId: string, managerEmployeeId: string): Promise<string[]> {
    const hierarchy = await ReportingHierarchyRepository.findMany(
      { managerId: managerEmployeeId, effectiveTo: null },
      { companyId },
    );
    return hierarchy.map((h) => h.employeeId);
  },
};
