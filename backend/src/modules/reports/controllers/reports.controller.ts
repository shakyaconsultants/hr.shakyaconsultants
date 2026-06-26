import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { buildReportsActor } from '@modules/approval/types/approval.types.js';
import { ExecutiveDashboardService } from '@modules/reports/services/executive-dashboard.service.js';
import { RoleDashboardService } from '@modules/reports/services/role-dashboard.service.js';
import { WidgetRegistryService } from '@modules/reports/services/widget-registry.service.js';
import { ReportEngineService } from '@modules/reports/services/report-engine.service.js';
import { ExportService } from '@modules/reports/services/export.service.js';
import { ReportsAuditService } from '@modules/reports/services/reports-audit.service.js';
import { AttendanceDashboardService } from '@modules/attendance/services/attendance-dashboard.service.js';
import { PayrollDashboardService } from '@modules/payroll/services/payroll-dashboard.service.js';
import { SalesDashboardService } from '@modules/sales/services/sales-dashboard.service.js';
import { ProjectDashboardService } from '@modules/project/services/project-dashboard.service.js';
import { REPORT_DOMAIN } from '@modules/reports/constants/reports.constants.js';
import type { ReportDomain, ReportRequest, ExecutiveRole } from '@modules/reports/types/reports.types.js';
import {
  dashboardQuerySchema,
  domainParamSchema,
  exportQuerySchema,
  idParamSchema,
  reportQuerySchema,
  roleParamSchema,
  searchQuerySchema,
  updateLayoutSchema,
  widgetDataQuerySchema,
} from '@modules/reports/validators/reports.validator.js';

function actor(req: AuthenticatedRequest) {
  return buildReportsActor(req);
}

export const getExecutiveDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(dashboardQuerySchema, req.query);
    const data = await ExecutiveDashboardService.getOverview(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getRoleDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { role } = validateInput(roleParamSchema, req.params);
    const query = validateInput(dashboardQuerySchema, req.query);
    const data = await RoleDashboardService.getDashboard(authReq.user.companyId, role as ExecutiveRole, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getWidgets: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const data = WidgetRegistryService.listWidgets(role);
    return ResponseService.success(res, authReq, { widgets: data });
  } catch (error) {
    next(error);
    return;
  }
};

export const getWidgetData: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const query = validateInput(widgetDataQuerySchema, req.query);
    const data = await WidgetRegistryService.getWidgetData(authReq.user.companyId, id, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSettings: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await WidgetRegistryService.getSettings(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateSettings: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ctx = actor(authReq);
    const payload = validateInput(updateLayoutSchema, req.body);
    const before = await WidgetRegistryService.getSettings(ctx.companyId);
    const data = await WidgetRegistryService.updateSettings(ctx.companyId, ctx.userId, payload);
    await ReportsAuditService.log({
      companyId: ctx.companyId,
      userId: ctx.userId,
      entityType: 'reports_settings',
      entityId: ctx.companyId,
      action: 'update_settings',
      before: before as unknown as Record<string, unknown>,
      after: data as unknown as Record<string, unknown>,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getDomainAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { domain } = validateInput(domainParamSchema, req.params);
    const query = validateInput(dashboardQuerySchema, req.query);
    const companyId = authReq.user.companyId;

    let data: unknown;
    switch (domain as ReportDomain) {
      case REPORT_DOMAIN.HR:
        data = await RoleDashboardService.getHrBundle(companyId, query);
        break;
      case REPORT_DOMAIN.FINANCE:
        data = {
          enterprise: await PayrollDashboardService.getEnterpriseDashboard(companyId, query),
          finance: await PayrollDashboardService.getFinanceDashboard(companyId, query),
        };
        break;
      case REPORT_DOMAIN.PROJECT:
        data = await ProjectDashboardService.getManagerDashboard(companyId);
        break;
      case REPORT_DOMAIN.SALES:
        data = await SalesDashboardService.getEnterpriseDashboard(companyId, query);
        break;
      case REPORT_DOMAIN.ATTENDANCE:
        data = {
          enterprise: await AttendanceDashboardService.getEnterpriseDashboard(companyId, query.startDate),
          weeklyTrend: await AttendanceDashboardService.getWeeklyTrend(companyId),
        };
        break;
      default:
        data = { domain, message: 'Analytics bundle not available for this domain' };
    }

    return ResponseService.success(res, authReq, { domain, analytics: data });
  } catch (error) {
    next(error);
    return;
  }
};

export const generateReport: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ctx = actor(authReq);
    const query = validateInput(reportQuerySchema, req.query);
    const request: ReportRequest = {
      domain: query.domain as ReportDomain,
      type: query.type,
      filters: query,
    };
    const data = await ReportEngineService.generate(authReq.user.companyId, request);
    await ReportsAuditService.log({
      companyId: ctx.companyId,
      userId: ctx.userId,
      entityType: 'report',
      entityId: `${query.domain}:${query.type}`,
      action: 'generate',
      after: { domain: query.domain, type: query.type },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const exportReport: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const ctx = actor(authReq);
    const query = validateInput(exportQuerySchema, req.query);
    const request: ReportRequest = {
      domain: query.domain as ReportDomain,
      type: query.type,
      filters: query,
    };

    await ReportsAuditService.log({
      companyId: ctx.companyId,
      userId: ctx.userId,
      entityType: 'report_export',
      entityId: `${query.domain}:${query.type}`,
      action: 'export',
      after: { format: query.format, domain: query.domain, type: query.type },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    if (query.format === 'pdf' || query.format === 'html') {
      const html = await ExportService.exportPdfHtml(authReq.user.companyId, request);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${query.domain}-${query.type}-report.html"`);
      return res.send(html);
    }

    const csv = await ExportService.exportCsv(authReq.user.companyId, request);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${query.domain}-${query.type}-report.csv"`);
    return res.send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const searchReports: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { q, role } = validateInput(searchQuerySchema, req.query);
    const metadata = WidgetRegistryService.searchMetadata(q);
    const widgets = role ? WidgetRegistryService.listWidgets(role) : WidgetRegistryService.listWidgets();
    const widgetMatches = widgets.filter(
      (w) => w.title.toLowerCase().includes(q.toLowerCase()) || w.id.toLowerCase().includes(q.toLowerCase()),
    );
    return ResponseService.success(res, authReq, { reports: metadata, widgets: widgetMatches });
  } catch (error) {
    next(error);
    return;
  }
};
