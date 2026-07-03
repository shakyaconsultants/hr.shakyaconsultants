import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ReportingChartNode, ReportingChartTree } from '@/features/employee/api/employee.api';
import {
  OrgChartCompanyNode,
  OrgChartConnector,
  OrgChartEmployeeCard,
  OrgChartHorizontalRail,
} from '@/features/admin/components/org-chart/org-chart-nodes';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

function mapToOrgEmployee(node: ReportingChartNode) {
  return {
    id: node.id,
    firstName: node.firstName,
    lastName: node.lastName,
    email: node.email,
    photoUrl: node.photoUrl,
    designationId: node.designationId ?? '',
    designationName: node.designationName ?? node.jobTitle ?? 'Team member',
    hierarchyLevel: 0,
  };
}

function ReportingNode({ node, depth = 0 }: { node: ReportingChartNode; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 2);
  const hasChildren = node.directReports.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute -left-8 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand team' : 'Collapse team'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        ) : null}
        <OrgChartEmployeeCard employee={mapToOrgEmployee(node)} />
        {node.directReports.length > 0 ? (
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            {node.directReports.length} direct report{node.directReports.length === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>

      {hasChildren && !collapsed ? (
        <>
          <OrgChartConnector />
          <OrgChartHorizontalRail childCount={node.directReports.length} />
          <div className="flex items-start justify-center gap-4">
            {node.directReports.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                {node.directReports.length > 1 ? <div className="h-6 w-px bg-border" aria-hidden /> : null}
                <ReportingNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

interface ReportingChartTreeViewProps {
  tree: ReportingChartTree;
  scale?: number;
  className?: string;
}

export function ReportingChartTreeView({ tree, scale = 1, className }: ReportingChartTreeViewProps) {
  if (tree.roots.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-10 text-center">
        <p className="text-lg font-semibold">No reporting hierarchy configured</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Open an employee profile → Reporting tab to assign managers and direct reports. Any employee can report to any
          other employee.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('origin-top transition-transform duration-200', className)}
      style={{ transform: `scale(${scale})` }}
    >
      <div className="mx-auto flex min-w-max flex-col items-center pb-8 pt-2">
        <OrgChartCompanyNode
          name={tree.companyName}
          code="Reporting lines"
          employeeCount={tree.stats.employees}
        />
        <OrgChartConnector />
        <div className="flex items-start justify-center gap-8">
          {tree.roots.map((root) => (
            <ReportingNode key={root.id} node={root} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReportingChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        Company
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-sky-500/30" />
        Employee (click to open profile)
      </span>
      <span>Lines show manager → direct report relationships</span>
    </div>
  );
}
