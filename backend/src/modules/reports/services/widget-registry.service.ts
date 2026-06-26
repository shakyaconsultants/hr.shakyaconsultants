import { AppSettingRepository, SETTING_GROUP, SETTING_VALUE_TYPE } from '@domain/master-data/master-data.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ReportEngineService } from '@modules/reports/services/report-engine.service.js';
import {
  REPORT_DOMAIN,
  EXECUTIVE_ROLE,
  WIDGET_TYPES,
  HR_REPORT_TYPE,
  REPORTS_SETTING_KEYS,
  DEFAULT_DASHBOARD_LAYOUT,
  SALES_DELEGATED_REPORT_TYPE,
  FINANCE_DELEGATED_REPORT_TYPE,
} from '@modules/reports/constants/reports.constants.js';
import type {
  DashboardLayout,
  ReportFilters,
  ReportMetadata,
  WidgetDefinition,
} from '@modules/reports/types/reports.types.js';

const BUILTIN_WIDGETS: WidgetDefinition[] = [
  {
    id: 'workforce_total',
    title: 'Total Employees',
    type: WIDGET_TYPES.STAT_CARD,
    domain: REPORT_DOMAIN.EXECUTIVE,
    defaultSize: { w: 3, h: 2 },
    roles: Object.values(EXECUTIVE_ROLE),
  },
  {
    id: 'attendance_rate',
    title: 'Attendance Rate',
    type: WIDGET_TYPES.PROGRESS,
    domain: REPORT_DOMAIN.ATTENDANCE,
    reportType: 'enterprise_dashboard',
    defaultSize: { w: 4, h: 3 },
    roles: [EXECUTIVE_ROLE.CEO, EXECUTIVE_ROLE.HR_HEAD, EXECUTIVE_ROLE.OPERATIONS_HEAD],
  },
  {
    id: 'employee_growth',
    title: 'Employee Growth',
    type: WIDGET_TYPES.TREND,
    domain: REPORT_DOMAIN.HR,
    reportType: HR_REPORT_TYPE.EMPLOYEE_GROWTH,
    defaultSize: { w: 6, h: 4 },
    roles: [EXECUTIVE_ROLE.CEO, EXECUTIVE_ROLE.HR_HEAD],
  },
  {
    id: 'department_strength',
    title: 'Department Strength',
    type: WIDGET_TYPES.CHART,
    domain: REPORT_DOMAIN.HR,
    reportType: HR_REPORT_TYPE.DEPARTMENT_STRENGTH,
    defaultSize: { w: 6, h: 4 },
    roles: [EXECUTIVE_ROLE.CEO, EXECUTIVE_ROLE.HR_HEAD],
  },
  {
    id: 'payroll_summary',
    title: 'Payroll Summary',
    type: WIDGET_TYPES.STAT_CARD,
    domain: REPORT_DOMAIN.FINANCE,
    reportType: FINANCE_DELEGATED_REPORT_TYPE.SUMMARY,
    defaultSize: { w: 4, h: 3 },
    roles: [EXECUTIVE_ROLE.CEO, EXECUTIVE_ROLE.FINANCE_HEAD],
  },
  {
    id: 'sales_pipeline',
    title: 'Sales Pipeline',
    type: WIDGET_TYPES.CHART,
    domain: REPORT_DOMAIN.SALES,
    reportType: SALES_DELEGATED_REPORT_TYPE.PIPELINE,
    defaultSize: { w: 6, h: 4 },
    roles: [EXECUTIVE_ROLE.CEO, EXECUTIVE_ROLE.SALES_HEAD],
  },
  {
    id: 'project_overview',
    title: 'Project Overview',
    type: WIDGET_TYPES.TABLE,
    domain: REPORT_DOMAIN.PROJECT,
    reportType: 'manager_dashboard',
    defaultSize: { w: 6, h: 4 },
    roles: [EXECUTIVE_ROLE.CEO, EXECUTIVE_ROLE.PROJECT_HEAD],
  },
  {
    id: 'hiring_funnel',
    title: 'Hiring Funnel',
    type: WIDGET_TYPES.CHART,
    domain: REPORT_DOMAIN.HR,
    reportType: HR_REPORT_TYPE.HIRING_FUNNEL,
    defaultSize: { w: 6, h: 4 },
    roles: [EXECUTIVE_ROLE.HR_HEAD],
  },
  {
    id: 'system_health',
    title: 'System Health',
    type: WIDGET_TYPES.STAT_CARD,
    domain: REPORT_DOMAIN.SYSTEM,
    defaultSize: { w: 3, h: 2 },
    roles: [EXECUTIVE_ROLE.OPERATIONS_HEAD],
  },
];

const REPORT_METADATA: ReportMetadata[] = [
  ...Object.values(HR_REPORT_TYPE).map((type) => ({
    id: `hr:${type}`,
    domain: REPORT_DOMAIN.HR as typeof REPORT_DOMAIN.HR,
    type,
    title: type.replace(/_/g, ' '),
    description: `HR analytics report: ${type}`,
    exportable: false,
  })),
  {
    id: 'attendance:summary',
    domain: REPORT_DOMAIN.ATTENDANCE,
    type: 'attendance_summary',
    title: 'Attendance Summary',
    description: 'Delegated attendance report',
    exportable: true,
  },
  {
    id: 'finance:summary',
    domain: REPORT_DOMAIN.FINANCE,
    type: FINANCE_DELEGATED_REPORT_TYPE.SUMMARY,
    title: 'Payroll Summary',
    description: 'Delegated payroll report',
    exportable: true,
  },
  {
    id: 'sales:pipeline',
    domain: REPORT_DOMAIN.SALES,
    type: SALES_DELEGATED_REPORT_TYPE.PIPELINE,
    title: 'Sales Pipeline',
    description: 'Delegated sales report',
    exportable: true,
  },
];

async function getSettingValue(companyId: string, key: string): Promise<unknown> {
  const setting = await AppSettingRepository.findOne({ key }, { companyId });
  return setting?.value;
}

async function upsertSetting(companyId: string, key: string, value: unknown, userId: string): Promise<void> {
  const existing = await AppSettingRepository.findOne({ key }, { companyId });
  if (existing) {
    await AppSettingRepository.update(existing.id, { value, updatedBy: userId }, { companyId });
    return;
  }

  await AppSettingRepository.create(
    {
      id: generateUuid(),
      companyId,
      key,
      value,
      valueType: SETTING_VALUE_TYPE.JSON,
      group: SETTING_GROUP.REPORTS,
      description: 'Reports dashboard configuration',
      isEditable: true,
      isPublic: false,
      encrypted: false,
      createdBy: userId,
      updatedBy: userId,
    },
    { companyId },
  );
}

export const WidgetRegistryService = {
  listWidgets(role?: string): WidgetDefinition[] {
    if (!role) return BUILTIN_WIDGETS;
    return BUILTIN_WIDGETS.filter((w) => w.roles.includes(role as typeof EXECUTIVE_ROLE[keyof typeof EXECUTIVE_ROLE]));
  },

  getWidget(id: string): WidgetDefinition | undefined {
    return BUILTIN_WIDGETS.find((w) => w.id === id);
  },

  async getWidgetData(companyId: string, widgetId: string, filters: ReportFilters = {}) {
    const widget = this.getWidget(widgetId);
    if (!widget) {
      return { error: 'Widget not found', widgetId };
    }

    if (widget.id === 'workforce_total') {
      const { ExecutiveDashboardService } = await import('@modules/reports/services/executive-dashboard.service.js');
      const overview = await ExecutiveDashboardService.getOverview(companyId, filters);
      return { widget, data: overview.workforce };
    }

    if (widget.id === 'system_health') {
      const { ExecutiveDashboardService } = await import('@modules/reports/services/executive-dashboard.service.js');
      const health = await ExecutiveDashboardService.getSystemHealth();
      return { widget, data: health };
    }

    if (widget.reportType) {
      const data = await ReportEngineService.generate(companyId, {
        domain: widget.domain,
        type: widget.reportType,
        filters,
      });
      return { widget, data };
    }

    return { widget, data: null };
  },

  async getSettings(companyId: string): Promise<{ layout: DashboardLayout; widgets: WidgetDefinition[] }> {
    const layout = (await getSettingValue(companyId, REPORTS_SETTING_KEYS.DASHBOARD_LAYOUT)) as DashboardLayout | undefined;
    return {
      layout: layout ?? DEFAULT_DASHBOARD_LAYOUT,
      widgets: BUILTIN_WIDGETS,
    };
  },

  async updateSettings(
    companyId: string,
    userId: string,
    layout: DashboardLayout,
  ): Promise<{ layout: DashboardLayout; widgets: WidgetDefinition[] }> {
    await upsertSetting(companyId, REPORTS_SETTING_KEYS.DASHBOARD_LAYOUT, layout, userId);
    return this.getSettings(companyId);
  },

  searchMetadata(query: string): ReportMetadata[] {
    const term = query.toLowerCase();
    return REPORT_METADATA.filter(
      (m) => m.title.toLowerCase().includes(term)
        || m.description.toLowerCase().includes(term)
        || m.type.toLowerCase().includes(term)
        || m.domain.toLowerCase().includes(term),
    );
  },

  listMetadata(): ReportMetadata[] {
    return REPORT_METADATA;
  },
};
