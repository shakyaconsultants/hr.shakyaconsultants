import {
  LeadRepository,
  DealRepository,
  FollowUpRepository,
  LeadActivityRepository,
  FOLLOW_UP_STATUS,
  DEAL_STATUS,
} from '@domain/sales/sales.schemas.js';
import { SALES_STATUS } from '@shared/constants/status.constants.js';
import { SalesTeamService } from '@modules/sales/services/sales-team.service.js';
import { SalesReportService } from '@modules/sales/services/sales-report.service.js';
import { SALES_REPORT_TYPE } from '@modules/sales/constants/sales.constants.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const SalesDashboardService = {
  async getEnterpriseDashboard(companyId: string, query?: { startDate?: string; endDate?: string }) {
    const [leads, deals, conversion, revenue] = await Promise.all([
      LeadRepository.findMany({}, { companyId }),
      DealRepository.findMany({}, { companyId }),
      SalesReportService.conversionReport(companyId, { type: SALES_REPORT_TYPE.CONVERSION, ...query }),
      SalesReportService.revenueReport(companyId, { type: SALES_REPORT_TYPE.REVENUE, ...query }),
    ]);

    const openDeals = deals.filter((d) => d.status === DEAL_STATUS.OPEN);
    const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);

    return {
      totalLeads: leads.length,
      activeLeads: leads.filter((l) => ![SALES_STATUS.WON, SALES_STATUS.LOST].includes(l.status as typeof SALES_STATUS.WON)).length,
      wonLeads: leads.filter((l) => l.status === SALES_STATUS.WON).length,
      lostLeads: leads.filter((l) => l.status === SALES_STATUS.LOST).length,
      openDeals: openDeals.length,
      pipelineValue: Math.round(pipelineValue * 100) / 100,
      conversion,
      revenue: {
        totalRevenue: revenue.totalRevenue,
        dealCount: revenue.dealCount,
        currency: revenue.currency,
      },
    };
  },

  async getManagerDashboard(context: SalesActorContext, _query?: { startDate?: string; endDate?: string }) {
    if (!context.employeeId) {
      return { teamMembers: [], leads: [], deals: [], followUps: [] };
    }

    const memberIds = await SalesTeamService.getMemberIdsForManager(context.companyId, context.employeeId);
    const leads = await LeadRepository.findMany({ assignedToId: { $in: memberIds } }, { companyId: context.companyId });
    const deals = await DealRepository.findMany({ ownerId: { $in: memberIds } }, { companyId: context.companyId });
    const followUps = await FollowUpRepository.findMany(
      { assignedToId: { $in: memberIds }, status: FOLLOW_UP_STATUS.PENDING },
      { companyId: context.companyId },
    );

    return {
      teamSize: memberIds.length,
      totalLeads: leads.length,
      wonLeads: leads.filter((l) => l.status === SALES_STATUS.WON).length,
      openDeals: deals.filter((d) => d.status === DEAL_STATUS.OPEN).length,
      pendingFollowUps: followUps.length,
      revenue: deals.filter((d) => d.status === DEAL_STATUS.WON).reduce((s, d) => s + d.value, 0),
      recentLeads: leads.slice(0, 10).map((l) => ({
        id: l.id,
        name: `${l.firstName} ${l.lastName}`,
        status: l.status,
        assignedToId: l.assignedToId,
        score: l.score,
      })),
    };
  },

  async getExecutiveDashboard(context: SalesActorContext, _query?: { startDate?: string; endDate?: string }) {
    if (!context.employeeId) {
      return { myLeads: 0, myDeals: 0, pendingFollowUps: 0, recentActivity: [] };
    }

    const [leads, deals, followUps, activities] = await Promise.all([
      LeadRepository.findMany({ assignedToId: context.employeeId }, { companyId: context.companyId }),
      DealRepository.findMany({ ownerId: context.employeeId }, { companyId: context.companyId }),
      FollowUpRepository.findMany(
        { assignedToId: context.employeeId, status: FOLLOW_UP_STATUS.PENDING },
        { companyId: context.companyId },
      ),
      LeadActivityRepository.findMany({ performedBy: context.employeeId }, { companyId: context.companyId }),
    ]);

    const sortedActivities = activities.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());

    return {
      myLeads: leads.length,
      myWonLeads: leads.filter((l) => l.status === SALES_STATUS.WON).length,
      myDeals: deals.length,
      myRevenue: deals.filter((d) => d.status === DEAL_STATUS.WON).reduce((s, d) => s + d.value, 0),
      pendingFollowUps: followUps.length,
      recentActivity: sortedActivities.slice(0, 10).map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        performedAt: a.performedAt,
        leadId: a.leadId,
      })),
    };
  },

  async getConversionAnalytics(companyId: string, query?: { startDate?: string; endDate?: string }) {
    return SalesReportService.conversionReport(companyId, { type: SALES_REPORT_TYPE.CONVERSION, ...query });
  },

  async getRevenueAnalytics(companyId: string, query?: { startDate?: string; endDate?: string; teamId?: string }) {
    return SalesReportService.revenueReport(companyId, { type: SALES_REPORT_TYPE.REVENUE, ...query });
  },
};
