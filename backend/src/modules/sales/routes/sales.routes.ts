import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { LEAD_PERMISSIONS, DEAL_PERMISSIONS, PIPELINE_PERMISSIONS } from '@modules/sales/constants/sales-permissions.constants.js';
import {
  assignLead,
  createActivity,
  createCallLog,
  createDeal,
  createFollowUp,
  createLead,
  createLeadSource,
  createPipeline,
  createSalesTarget,
  createSalesTeam,
  createTerritory,
  deleteActivity,
  deleteCallLog,
  deleteDeal,
  deleteFollowUp,
  deleteLead,
  deleteLeadSource,
  deletePipeline,
  deleteSalesTarget,
  deleteSalesTeam,
  deleteTerritory,
  exportLeads,
  exportReports,
  getActivity,
  getCallLog,
  getConversionAnalytics,
  getDeal,
  getEnterpriseDashboard,
  getExecutiveDashboard,
  getFollowUp,
  getLead,
  getLeadKanban,
  getLeadSource,
  getLeadTimeline,
  getManagerDashboard,
  getPipeline,
  getPolicies,
  getReports,
  getRevenueAnalytics,
  getSalesTarget,
  getSalesTeam,
  getSettings,
  getTerritory,
  importLeads,
  listActivities,
  listCallLogs,
  listDeals,
  listFollowUps,
  listLeadSources,
  listLeads,
  listMyLeads,
  listTeamLeads,
  listPipelines,
  listSalesTargets,
  listSalesTeams,
  listTerritories,
  moveLeadStage,
  updateActivity,
  updateCallLog,
  updateDeal,
  updateFollowUp,
  updateLead,
  updateLeadSource,
  updatePipeline,
  updatePolicies,
  updateSalesTarget,
  updateSalesTeam,
  updateSettings,
  updateTerritory,
} from '@modules/sales/controllers/sales.controller.js';

const salesRoutes = Router();

salesRoutes.use(authenticateMiddleware);
salesRoutes.use(companyScopeMiddleware());

/** @swagger tags: [Sales] */
salesRoutes.get('/dashboard/enterprise', authorize(LEAD_PERMISSIONS.READ), getEnterpriseDashboard);
salesRoutes.get('/dashboard/manager', authorize(LEAD_PERMISSIONS.READ), getManagerDashboard);
salesRoutes.get('/dashboard/executive', authorize(LEAD_PERMISSIONS.READ), getExecutiveDashboard);

salesRoutes.get('/policies', authorize(LEAD_PERMISSIONS.READ), getPolicies);
salesRoutes.patch('/policies', authorize(LEAD_PERMISSIONS.UPDATE), updatePolicies);
salesRoutes.get('/settings', authorize(LEAD_PERMISSIONS.READ), getSettings);
salesRoutes.patch('/settings', authorize(LEAD_PERMISSIONS.UPDATE), updateSettings);

salesRoutes.get('/lead-sources', authorize(LEAD_PERMISSIONS.READ), listLeadSources);
salesRoutes.post('/lead-sources', authorize(LEAD_PERMISSIONS.CREATE), createLeadSource);
salesRoutes.get('/lead-sources/:id', authorize(LEAD_PERMISSIONS.READ), getLeadSource);
salesRoutes.patch('/lead-sources/:id', authorize(LEAD_PERMISSIONS.UPDATE), updateLeadSource);
salesRoutes.delete('/lead-sources/:id', authorize(LEAD_PERMISSIONS.DELETE), deleteLeadSource);

salesRoutes.get('/pipelines', authorize(PIPELINE_PERMISSIONS.READ), listPipelines);
salesRoutes.post('/pipelines', authorize(PIPELINE_PERMISSIONS.CREATE), createPipeline);
salesRoutes.get('/pipelines/:id', authorize(PIPELINE_PERMISSIONS.READ), getPipeline);
salesRoutes.patch('/pipelines/:id', authorize(PIPELINE_PERMISSIONS.UPDATE), updatePipeline);
salesRoutes.delete('/pipelines/:id', authorize(PIPELINE_PERMISSIONS.DELETE), deletePipeline);

salesRoutes.get('/sales-teams', authorize(LEAD_PERMISSIONS.READ), listSalesTeams);
salesRoutes.post('/sales-teams', authorize(LEAD_PERMISSIONS.UPDATE), createSalesTeam);
salesRoutes.get('/sales-teams/:id', authorize(LEAD_PERMISSIONS.READ), getSalesTeam);
salesRoutes.patch('/sales-teams/:id', authorize(LEAD_PERMISSIONS.UPDATE), updateSalesTeam);
salesRoutes.delete('/sales-teams/:id', authorize(LEAD_PERMISSIONS.UPDATE), deleteSalesTeam);

salesRoutes.get('/territories', authorize(LEAD_PERMISSIONS.READ), listTerritories);
salesRoutes.post('/territories', authorize(LEAD_PERMISSIONS.UPDATE), createTerritory);
salesRoutes.get('/territories/:id', authorize(LEAD_PERMISSIONS.READ), getTerritory);
salesRoutes.patch('/territories/:id', authorize(LEAD_PERMISSIONS.UPDATE), updateTerritory);
salesRoutes.delete('/territories/:id', authorize(LEAD_PERMISSIONS.UPDATE), deleteTerritory);

salesRoutes.get('/sales-targets', authorize(DEAL_PERMISSIONS.READ), listSalesTargets);
salesRoutes.post('/sales-targets', authorize(DEAL_PERMISSIONS.CREATE), createSalesTarget);
salesRoutes.get('/sales-targets/:id', authorize(DEAL_PERMISSIONS.READ), getSalesTarget);
salesRoutes.patch('/sales-targets/:id', authorize(DEAL_PERMISSIONS.UPDATE), updateSalesTarget);
salesRoutes.delete('/sales-targets/:id', authorize(DEAL_PERMISSIONS.DELETE), deleteSalesTarget);

salesRoutes.get('/leads', authorize(LEAD_PERMISSIONS.READ), listLeads);
salesRoutes.post('/leads', authorize(LEAD_PERMISSIONS.CREATE), createLead);
salesRoutes.post('/leads/import', authorize(LEAD_PERMISSIONS.CREATE), importLeads);
salesRoutes.get('/leads/export', authorize(LEAD_PERMISSIONS.READ), exportLeads);
salesRoutes.get('/leads/me', authorize(LEAD_PERMISSIONS.READ), listMyLeads);
salesRoutes.get('/leads/team', authorize(LEAD_PERMISSIONS.READ), listTeamLeads);
salesRoutes.get('/leads/kanban', authorize(LEAD_PERMISSIONS.READ), getLeadKanban);
salesRoutes.get('/leads/:id', authorize(LEAD_PERMISSIONS.READ), getLead);
salesRoutes.patch('/leads/:id', authorize(LEAD_PERMISSIONS.UPDATE), updateLead);
salesRoutes.delete('/leads/:id', authorize(LEAD_PERMISSIONS.DELETE), deleteLead);
salesRoutes.post('/leads/:id/assign', authorize(LEAD_PERMISSIONS.UPDATE), assignLead);
salesRoutes.post('/leads/:id/move-stage', authorize(LEAD_PERMISSIONS.UPDATE), moveLeadStage);
salesRoutes.get('/leads/:id/timeline', authorize(LEAD_PERMISSIONS.READ), getLeadTimeline);

salesRoutes.get('/activities', authorize(LEAD_PERMISSIONS.READ), listActivities);
salesRoutes.post('/activities', authorize(LEAD_PERMISSIONS.CREATE), createActivity);
salesRoutes.get('/activities/:id', authorize(LEAD_PERMISSIONS.READ), getActivity);
salesRoutes.patch('/activities/:id', authorize(LEAD_PERMISSIONS.UPDATE), updateActivity);
salesRoutes.delete('/activities/:id', authorize(LEAD_PERMISSIONS.DELETE), deleteActivity);

salesRoutes.get('/call-logs', authorize(LEAD_PERMISSIONS.READ), listCallLogs);
salesRoutes.post('/call-logs', authorize(LEAD_PERMISSIONS.CREATE), createCallLog);
salesRoutes.get('/call-logs/:id', authorize(LEAD_PERMISSIONS.READ), getCallLog);
salesRoutes.patch('/call-logs/:id', authorize(LEAD_PERMISSIONS.UPDATE), updateCallLog);
salesRoutes.delete('/call-logs/:id', authorize(LEAD_PERMISSIONS.DELETE), deleteCallLog);

salesRoutes.get('/follow-ups', authorize(LEAD_PERMISSIONS.READ), listFollowUps);
salesRoutes.post('/follow-ups', authorize(LEAD_PERMISSIONS.CREATE), createFollowUp);
salesRoutes.get('/follow-ups/:id', authorize(LEAD_PERMISSIONS.READ), getFollowUp);
salesRoutes.patch('/follow-ups/:id', authorize(LEAD_PERMISSIONS.UPDATE), updateFollowUp);
salesRoutes.delete('/follow-ups/:id', authorize(LEAD_PERMISSIONS.DELETE), deleteFollowUp);

salesRoutes.get('/deals', authorize(DEAL_PERMISSIONS.READ), listDeals);
salesRoutes.post('/deals', authorize(DEAL_PERMISSIONS.CREATE), createDeal);
salesRoutes.get('/deals/:id', authorize(DEAL_PERMISSIONS.READ), getDeal);
salesRoutes.patch('/deals/:id', authorize(DEAL_PERMISSIONS.UPDATE), updateDeal);
salesRoutes.delete('/deals/:id', authorize(DEAL_PERMISSIONS.DELETE), deleteDeal);

salesRoutes.get('/reports', authorize(LEAD_PERMISSIONS.READ), getReports);
salesRoutes.get('/reports/export', authorize(LEAD_PERMISSIONS.READ), exportReports);

salesRoutes.get('/analytics/conversion', authorize(LEAD_PERMISSIONS.READ), getConversionAnalytics);
salesRoutes.get('/analytics/revenue', authorize(DEAL_PERMISSIONS.READ), getRevenueAnalytics);

export { salesRoutes };
