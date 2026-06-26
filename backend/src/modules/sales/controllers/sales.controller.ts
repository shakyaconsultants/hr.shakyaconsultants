import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { PermissionEngineService } from '@modules/auth/services/permission-engine.service.js';
import { buildSalesActor } from '@modules/approval/types/approval.types.js';
import { SalesPolicyService } from '@modules/sales/services/sales-policy.service.js';
import { LeadSourceService } from '@modules/sales/services/lead-source.service.js';
import { PipelineService } from '@modules/sales/services/pipeline.service.js';
import { SalesTeamService } from '@modules/sales/services/sales-team.service.js';
import { TerritoryService } from '@modules/sales/services/territory.service.js';
import { SalesTargetService } from '@modules/sales/services/sales-target.service.js';
import { LeadService } from '@modules/sales/services/lead.service.js';
import { LeadAssignmentService } from '@modules/sales/services/lead-assignment.service.js';
import { LeadActivityService } from '@modules/sales/services/lead-activity.service.js';
import { CallLogService } from '@modules/sales/services/call-log.service.js';
import { FollowUpService } from '@modules/sales/services/follow-up.service.js';
import { DealService } from '@modules/sales/services/deal.service.js';
import { SalesReportService } from '@modules/sales/services/sales-report.service.js';
import { SalesDashboardService } from '@modules/sales/services/sales-dashboard.service.js';
import {
  assignLeadSchema,
  createActivitySchema,
  createCallLogSchema,
  createDealSchema,
  createFollowUpSchema,
  createLeadSchema,
  createLeadSourceSchema,
  createPipelineSchema,
  createSalesTargetSchema,
  createSalesTeamSchema,
  createTerritorySchema,
  dashboardQuerySchema,
  analyticsQuerySchema,
  idParamSchema,
  importLeadsSchema,
  listActivitiesQuerySchema,
  listCallLogsQuerySchema,
  listDealsQuerySchema,
  listFollowUpsQuerySchema,
  listLeadsQuerySchema,
  listQuerySchema,
  listSalesTargetsQuerySchema,
  listSalesTeamsQuerySchema,
  listTerritoriesQuerySchema,
  moveStageSchema,
  reportQuerySchema,
  updateActivitySchema,
  updateCallLogSchema,
  updateDealSchema,
  updateFollowUpSchema,
  updateLeadSchema,
  updateLeadSourceSchema,
  updatePipelineSchema,
  updatePoliciesSchema,
  updateSalesTargetSchema,
  updateSalesTeamSchema,
  updateTerritorySchema,
} from '@modules/sales/validators/sales.validator.js';

function actor(req: AuthenticatedRequest) {
  return buildSalesActor(req);
}

async function permissions(req: AuthenticatedRequest): Promise<string[]> {
  if (req.auth?.permissions) return req.auth.permissions;
  if (!req.user.employeeId) return [];
  const perms = await PermissionEngineService.getPermissionsForUser(req.user.companyId, req.user.employeeId);
  req.auth = { permissions: perms };
  return perms;
}

export const getEnterpriseDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(dashboardQuerySchema, req.query);
    const data = await SalesDashboardService.getEnterpriseDashboard(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getManagerDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(dashboardQuerySchema, req.query);
    const data = await SalesDashboardService.getManagerDashboard(actor(authReq), query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getExecutiveDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(dashboardQuerySchema, req.query);
    const data = await SalesDashboardService.getExecutiveDashboard(actor(authReq), query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getPolicies: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await SalesPolicyService.getPolicies(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updatePolicies: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(updatePoliciesSchema, req.body);
    const data = await SalesPolicyService.updatePolicies(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSettings: RequestHandler = getPolicies;
export const updateSettings: RequestHandler = updatePolicies;

export const listLeadSources: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await LeadSourceService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createLeadSource: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createLeadSourceSchema, req.body);
    const data = await LeadSourceService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getLeadSource: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await LeadSourceService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateLeadSource: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateLeadSourceSchema, req.body);
    const data = await LeadSourceService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteLeadSource: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await LeadSourceService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listPipelines: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await PipelineService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createPipeline: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createPipelineSchema, req.body);
    const data = await PipelineService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getPipeline: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await PipelineService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updatePipeline: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updatePipelineSchema, req.body);
    const data = await PipelineService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deletePipeline: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await PipelineService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listSalesTeams: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listSalesTeamsQuerySchema, req.query);
    const data = await SalesTeamService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createSalesTeam: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createSalesTeamSchema, req.body);
    const data = await SalesTeamService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSalesTeam: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const team = await SalesTeamService.getById(authReq.user.companyId, id);
    const data = await SalesTeamService.enrichWithNames(authReq.user.companyId, team);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateSalesTeam: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateSalesTeamSchema, req.body);
    const data = await SalesTeamService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteSalesTeam: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await SalesTeamService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listTerritories: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listTerritoriesQuerySchema, req.query);
    const data = await TerritoryService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createTerritory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createTerritorySchema, req.body);
    const data = await TerritoryService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getTerritory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const territory = await TerritoryService.getById(authReq.user.companyId, id);
    const data = await TerritoryService.enrich(authReq.user.companyId, territory);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateTerritory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateTerritorySchema, req.body);
    const data = await TerritoryService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteTerritory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await TerritoryService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listSalesTargets: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listSalesTargetsQuerySchema, req.query);
    const data = await SalesTargetService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createSalesTarget: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createSalesTargetSchema, req.body);
    const data = await SalesTargetService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSalesTarget: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await SalesTargetService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateSalesTarget: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateSalesTargetSchema, req.body);
    const data = await SalesTargetService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteSalesTarget: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await SalesTargetService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listLeads: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listLeadsQuerySchema, req.query);
    const perms = await permissions(authReq);
    const data = await LeadService.list(actor(authReq), perms, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createLead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createLeadSchema, req.body);
    const data = await LeadService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getLead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const perms = await permissions(authReq);
    const data = await LeadService.getById(actor(authReq), perms, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateLead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateLeadSchema, req.body);
    const perms = await permissions(authReq);
    const data = await LeadService.update(actor(authReq), perms, id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteLead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const perms = await permissions(authReq);
    await LeadService.delete(actor(authReq), perms, id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const importLeads: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(importLeadsSchema, req.body);
    const data = await LeadService.importCsv(actor(authReq), payload.csv);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const exportLeads: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const perms = await permissions(authReq);
    const csv = await LeadService.exportCsv(actor(authReq), perms);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads-export.csv"');
    return res.send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const assignLead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(assignLeadSchema, req.body);
    const data = await LeadAssignmentService.assign(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const moveLeadStage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(moveStageSchema, req.body);
    const perms = await permissions(authReq);
    const data = await LeadService.moveStage(actor(authReq), perms, id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getLeadTimeline: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const perms = await permissions(authReq);
    await LeadService.getById(actor(authReq), perms, id);
    const data = await LeadActivityService.getTimeline(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listActivities: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listActivitiesQuerySchema, req.query);
    const data = await LeadActivityService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createActivity: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createActivitySchema, req.body);
    const data = await LeadActivityService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getActivity: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await LeadActivityService.list(authReq.user.companyId, {});
    const activity = data.items.find((a) => a.id === id);
    return ResponseService.success(res, authReq, activity ?? null);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateActivity: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateActivitySchema, req.body);
    const data = await LeadActivityService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteActivity: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await LeadActivityService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listCallLogs: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listCallLogsQuerySchema, req.query);
    const data = await CallLogService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createCallLog: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createCallLogSchema, req.body);
    const data = await CallLogService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getCallLog: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await CallLogService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateCallLog: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateCallLogSchema, req.body);
    const data = await CallLogService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteCallLog: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await CallLogService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listFollowUps: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listFollowUpsQuerySchema, req.query);
    const data = await FollowUpService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createFollowUp: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createFollowUpSchema, req.body);
    const data = await FollowUpService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getFollowUp: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await FollowUpService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateFollowUp: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateFollowUpSchema, req.body);
    const data = await FollowUpService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteFollowUp: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await FollowUpService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listDeals: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listDealsQuerySchema, req.query);
    const data = await DealService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createDeal: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createDealSchema, req.body);
    const data = await DealService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getDeal: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await DealService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateDeal: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateDealSchema, req.body);
    const data = await DealService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteDeal: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await DealService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const getReports: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(reportQuerySchema, req.query);
    const data = await SalesReportService.generate(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const exportReports: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(reportQuerySchema, req.query);

    if (query.format === 'html') {
      const html = await SalesReportService.exportHtml(authReq.user.companyId, query);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.html"');
      return res.send(html);
    }

    const csv = await SalesReportService.exportCsv(authReq.user.companyId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
    return res.send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const getConversionAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(analyticsQuerySchema, req.query);
    const data = await SalesDashboardService.getConversionAnalytics(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getRevenueAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(analyticsQuerySchema, req.query);
    const data = await SalesDashboardService.getRevenueAnalytics(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};
