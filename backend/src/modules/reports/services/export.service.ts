import { ModuleReportAdapter } from '@modules/reports/services/module-report.adapter.js';
import { ReportEngineService } from '@modules/reports/services/report-engine.service.js';
import { HrAnalyticsService } from '@modules/reports/services/hr-analytics.service.js';
import { REPORT_DOMAIN } from '@modules/reports/constants/reports.constants.js';
import type { ReportRequest } from '@modules/reports/types/reports.types.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const ExportService = {
  async exportCsv(companyId: string, request: ReportRequest): Promise<string> {
    const delegated = await ModuleReportAdapter.exportCsv(companyId, request);
    if (delegated) {
      return delegated;
    }

    const data = await ReportEngineService.generate(companyId, request, { skipCache: true });
    const headers = ['field', 'value'];
    const rows: string[][] = [];

    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        if (typeof value === 'object' && value !== null) {
          rows.push([key, JSON.stringify(value)]);
        } else {
          rows.push([key, String(value ?? '')]);
        }
      }
    }

    return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
  },

  async exportPdfHtml(companyId: string, request: ReportRequest): Promise<string> {
    const htmlDelegated = await ModuleReportAdapter.exportHtml(companyId, request);
    if (htmlDelegated) {
      return htmlDelegated.replace('</body>', '<p class="print-ready">Print-ready</p></body>');
    }

    const data = await ReportEngineService.generate(companyId, request, { skipCache: true });
    const title = `${request.domain} Report — ${request.type}`;
    const json = escapeHtml(JSON.stringify(data, null, 2));

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @media print { body { margin: 0; } .no-print { display: none; } }
  body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1a1a; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .meta { color: #666; margin-bottom: 1.5rem; }
  pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow: auto; font-size: 12px; }
  .print-ready { margin-top: 24px; font-size: 11px; color: #888; }
</style>
</head><body class="print-ready">
<h1>${escapeHtml(title)}</h1>
<p class="meta">Generated: ${new Date().toISOString()} | Company: ${escapeHtml(companyId)}</p>
<pre>${json}</pre>
<p class="print-ready">This document is print-ready.</p>
</body></html>`;
  },

  async exportAnalyticsBundleCsv(companyId: string, domain: string, filters: ReportRequest['filters']): Promise<string> {
    if (domain === REPORT_DOMAIN.HR) {
      const bundle = await Promise.all([
        HrAnalyticsService.employeeGrowth(companyId, filters ?? {}),
        HrAnalyticsService.departmentStrength(companyId, filters ?? {}),
        HrAnalyticsService.leaveAnalytics(companyId, filters ?? {}),
      ]);
      return ['section,data', ...bundle.map((b, i) => `section_${i},"${JSON.stringify(b).replace(/"/g, '""')}"`)].join('\n');
    }

    const data = await ReportEngineService.generate(companyId, { domain: domain as ReportRequest['domain'], type: 'summary', filters });
    return `domain,type,data\n${domain},summary,"${JSON.stringify(data).replace(/"/g, '""')}"`;
  },
};
