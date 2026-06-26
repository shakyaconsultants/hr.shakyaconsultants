import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import type { ReportDomain } from '@/features/reports/api/reports.api';

const MODULE_REPORT_ROUTES: Partial<Record<ReportDomain | string, { label: string; path: string }>> = {
  attendance: { label: 'Attendance Reports', path: ROUTES.ATTENDANCE_REPORTS },
  payroll: { label: 'Payroll Reports', path: ROUTES.PAYROLL_REPORTS },
  finance: { label: 'Payroll Finance Reports', path: ROUTES.PAYROLL_REPORTS },
  sales: { label: 'Sales CRM Reports', path: ROUTES.SALES_REPORTS },
  communication: { label: 'Communication Reports', path: ROUTES.COMMUNICATION_REPORTS },
};

export interface DomainReportPanelProps {
  domain: ReportDomain | string;
  title?: string;
  description?: string;
}

export function DomainReportPanel({ domain, title, description }: DomainReportPanelProps) {
  const moduleLink = MODULE_REPORT_ROUTES[domain];

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold capitalize">{title ?? `${domain} Module Reports`}</h3>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {moduleLink ? (
          <Link
            to={moduleLink.path}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open {moduleLink.label}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Module-specific operational reports remain in their respective modules. Use the centralized catalog above for
        cross-domain BI reports.
      </p>
    </section>
  );
}
