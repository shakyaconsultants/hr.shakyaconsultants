import {
  LeadRepository,
  DealRepository,
  LeadActivityRepository,
  FollowUpRepository,
  LeadSourceRepository,
  PipelineRepository,
  DEAL_STATUS,
  FOLLOW_UP_STATUS,
} from '@domain/sales/sales.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { SALES_STATUS } from '@shared/constants/status.constants.js';
import { SALES_REPORT_TYPE } from '@modules/sales/constants/sales.constants.js';

interface ReportQuery {
  type: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  teamId?: string;
  sourceId?: string;
  pipelineId?: string;
  format?: string;
}

function dateFilter(startDate?: string, endDate?: string): Record<string, unknown> | undefined {
  if (!startDate && !endDate) return undefined;
  const filter: Record<string, unknown> = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) filter.$lte = new Date(endDate);
  return filter;
}

export const SalesReportService = {
  async generate(companyId: string, query: ReportQuery) {
    switch (query.type) {
      case SALES_REPORT_TYPE.SOURCE:
        return this.sourceReport(companyId, query);
      case SALES_REPORT_TYPE.EXECUTIVE:
        return this.executiveReport(companyId, query);
      case SALES_REPORT_TYPE.PIPELINE:
        return this.pipelineReport(companyId, query);
      case SALES_REPORT_TYPE.CONVERSION:
        return this.conversionReport(companyId, query);
      case SALES_REPORT_TYPE.REVENUE:
        return this.revenueReport(companyId, query);
      case SALES_REPORT_TYPE.ACTIVITY:
        return this.activityReport(companyId, query);
      case SALES_REPORT_TYPE.FOLLOW_UP:
        return this.followUpReport(companyId, query);
      default:
        return this.pipelineReport(companyId, query);
    }
  },

  async sourceReport(companyId: string, query: ReportQuery) {
    const sources = await LeadSourceRepository.findMany({}, { companyId });
    const leadFilter: Record<string, unknown> = {};
    const createdAt = dateFilter(query.startDate, query.endDate);
    if (createdAt) leadFilter.createdAt = createdAt;
    const leads = await LeadRepository.findMany(leadFilter, { companyId });

    const bySource: Record<string, { count: number; won: number; value: number }> = {};
    for (const lead of leads) {
      const key = lead.sourceId ?? lead.source ?? 'unknown';
      if (!bySource[key]) bySource[key] = { count: 0, won: 0, value: 0 };
      bySource[key].count++;
      if (lead.status === SALES_STATUS.WON) {
        bySource[key].won++;
        bySource[key].value += lead.dealValue ?? lead.estimatedValue ?? 0;
      }
    }

    return { type: SALES_REPORT_TYPE.SOURCE, sources: sources.length, bySource };
  },

  async executiveReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = {};
    if (query.employeeId) filter.assignedToId = query.employeeId;
    const leads = await LeadRepository.findMany(filter, { companyId });
    const deals = await DealRepository.findMany(
      query.employeeId ? { ownerId: query.employeeId } : {},
      { companyId },
    );

    const employees = await EmployeeRepository.findMany({}, { companyId });
    const byExecutive = employees.map((emp) => {
      const empLeads = leads.filter((l) => l.assignedToId === emp.id);
      const empDeals = deals.filter((d) => d.ownerId === emp.id);
      return {
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        leadCount: empLeads.length,
        wonLeads: empLeads.filter((l) => l.status === SALES_STATUS.WON).length,
        dealCount: empDeals.length,
        revenue: empDeals.filter((d) => d.status === DEAL_STATUS.WON).reduce((s, d) => s + d.value, 0),
      };
    });

    return { type: SALES_REPORT_TYPE.EXECUTIVE, byExecutive };
  },

  async pipelineReport(companyId: string, query: ReportQuery) {
    const pipeline = query.pipelineId
      ? await PipelineRepository.findById(query.pipelineId, { companyId })
      : await PipelineRepository.findOne({ isDefault: true }, { companyId });

    const leadFilter: Record<string, unknown> = {};
    if (pipeline) leadFilter.pipelineId = pipeline.id;
    const leads = await LeadRepository.findMany(leadFilter, { companyId });

    const byStage: Record<string, { count: number; value: number }> = {};
    for (const lead of leads) {
      const stageId = lead.stageId ?? 'unassigned';
      if (!byStage[stageId]) byStage[stageId] = { count: 0, value: 0 };
      byStage[stageId].count++;
      byStage[stageId].value += lead.dealValue ?? lead.estimatedValue ?? 0;
    }

    return {
      type: SALES_REPORT_TYPE.PIPELINE,
      pipelineId: pipeline?.id,
      pipelineName: pipeline?.name,
      stages: pipeline?.stages ?? [],
      byStage,
    };
  },

  async conversionReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = {};
    const createdAt = dateFilter(query.startDate, query.endDate);
    if (createdAt) filter.createdAt = createdAt;
    const leads = await LeadRepository.findMany(filter, { companyId });

    const total = leads.length;
    const qualified = leads.filter((l) => [SALES_STATUS.QUALIFIED, SALES_STATUS.PROPOSAL, SALES_STATUS.WON].includes(l.status as typeof SALES_STATUS.QUALIFIED)).length;
    const won = leads.filter((l) => l.status === SALES_STATUS.WON).length;
    const lost = leads.filter((l) => l.status === SALES_STATUS.LOST).length;

    return {
      type: SALES_REPORT_TYPE.CONVERSION,
      total,
      qualified,
      won,
      lost,
      qualificationRate: total > 0 ? Math.round((qualified / total) * 10000) / 100 : 0,
      winRate: total > 0 ? Math.round((won / total) * 10000) / 100 : 0,
    };
  },

  async revenueReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = { status: DEAL_STATUS.WON };
    const closedAt = dateFilter(query.startDate, query.endDate);
    if (closedAt) filter.closedAt = closedAt;
    if (query.teamId) filter.teamId = query.teamId;
    if (query.employeeId) filter.ownerId = query.employeeId;

    const deals = await DealRepository.findMany(filter, { companyId });
    const totalRevenue = deals.reduce((s, d) => s + d.value, 0);

    return {
      type: SALES_REPORT_TYPE.REVENUE,
      dealCount: deals.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      currency: deals[0]?.currency ?? 'INR',
      deals: deals.map((d) => ({ id: d.id, name: d.name, value: d.value, ownerId: d.ownerId, closedAt: d.closedAt })),
    };
  },

  async activityReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = {};
    const performedAt = dateFilter(query.startDate, query.endDate);
    if (performedAt) filter.performedAt = performedAt;
    if (query.employeeId) filter.performedBy = query.employeeId;

    const activities = await LeadActivityRepository.findMany(filter, { companyId });
    const byType: Record<string, number> = {};
    for (const activity of activities) {
      byType[activity.type] = (byType[activity.type] ?? 0) + 1;
    }

    return { type: SALES_REPORT_TYPE.ACTIVITY, total: activities.length, byType };
  },

  async followUpReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = {};
    if (query.employeeId) filter.assignedToId = query.employeeId;
    const followUps = await FollowUpRepository.findMany(filter, { companyId });

    return {
      type: SALES_REPORT_TYPE.FOLLOW_UP,
      pending: followUps.filter((f) => f.status === FOLLOW_UP_STATUS.PENDING).length,
      completed: followUps.filter((f) => f.status === FOLLOW_UP_STATUS.COMPLETED).length,
      overdue: followUps.filter((f) => f.status === FOLLOW_UP_STATUS.OVERDUE).length,
      cancelled: followUps.filter((f) => f.status === FOLLOW_UP_STATUS.CANCELLED).length,
    };
  },

  async exportCsv(companyId: string, query: ReportQuery): Promise<string> {
    const report = await this.generate(companyId, query);
    const lines = [`Report Type: ${query.type}`, `Generated: ${new Date().toISOString()}`, ''];

    if ('byExecutive' in report && Array.isArray(report.byExecutive)) {
      const headers = ['employeeId', 'name', 'leadCount', 'wonLeads', 'dealCount', 'revenue'];
      lines.push(headers.join(','));
      for (const row of report.byExecutive as Array<Record<string, unknown>>) {
        lines.push(headers.map((h) => String(row[h] ?? '')).join(','));
      }
    } else {
      lines.push(JSON.stringify(report));
    }

    return lines.join('\n');
  },

  async exportHtml(companyId: string, query: ReportQuery): Promise<string> {
    const report = await this.generate(companyId, query);
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Sales Report - ${query.type}</title>
<style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style>
</head><body>
<h1>Sales Report: ${query.type}</h1>
<p>Generated: ${new Date().toISOString()}</p>
<pre>${JSON.stringify(report, null, 2)}</pre>
</body></html>`;
  },
};
