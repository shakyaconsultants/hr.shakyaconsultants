import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type {
  OrgChartDepartment,
  OrgChartTree,
} from '@/features/admin/components/org-chart/org-chart.types';
import {
  OrgChartBranchNode,
  OrgChartCompanyNode,
  OrgChartConnector,
  OrgChartDepartmentNode,
  OrgChartEmployeeCard,
  OrgChartHorizontalRail,
} from '@/features/admin/components/org-chart/org-chart-nodes';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

const EMPLOYEE_PREVIEW = 4;

interface OrgChartTreeViewProps {
  tree: OrgChartTree;
  scale?: number;
  className?: string;
}

function DepartmentEmployees({ department }: { department: OrgChartDepartment }) {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const visibleMembers = showAllMembers
    ? department.members
    : department.members.slice(0, EMPLOYEE_PREVIEW);
  const hiddenMemberCount = department.members.length - visibleMembers.length;
  const hasPeople = Boolean(department.head) || department.members.length > 0;

  if (!hasPeople) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
        No employees assigned
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {department.head ? (
        <>
          <OrgChartEmployeeCard employee={department.head} />
          {department.members.length > 0 ? <OrgChartConnector /> : null}
        </>
      ) : null}

      {department.members.length > 0 ? (
        <div className="flex flex-col items-stretch gap-2">
          {visibleMembers.map((employee) => (
            <OrgChartEmployeeCard key={employee.id} employee={employee} compact />
          ))}
          {hiddenMemberCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowAllMembers((value) => !value)}
            >
              {showAllMembers ? 'Show fewer' : `+${hiddenMemberCount} more`}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function OrgChartTreeView({ tree, scale = 1, className }: OrgChartTreeViewProps) {
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set());
  const [collapsedDepartments, setCollapsedDepartments] = useState<Set<string>>(new Set());

  function toggleBranch(branchId: string) {
    setCollapsedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) next.delete(branchId);
      else next.add(branchId);
      return next;
    });
  }

  function toggleDepartment(deptId: string) {
    setCollapsedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  }

  if (tree.branches.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-10 text-center">
        <p className="text-lg font-semibold">No organizational structure yet</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Add branches and departments from Organization settings to visualize your company
          hierarchy here.
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
          code={tree.companyCode}
          employeeCount={tree.stats.employees}
        />

        <OrgChartConnector />

        <div
          className="relative flex items-start justify-center gap-6"
          style={{ minWidth: `${Math.max(tree.branches.length * 260, 320)}px` }}
        >
          {tree.branches.length > 1 ? (
            <div
              className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-px bg-border"
              aria-hidden
            />
          ) : null}

          {tree.branches.map((branch) => {
            const branchCollapsed = collapsedBranches.has(branch.id);

            return (
              <div key={branch.id} className="flex flex-col items-center">
                {tree.branches.length > 1 ? (
                  <div className="mb-0 h-6 w-px bg-border" aria-hidden />
                ) : null}

                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute -left-8 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={() => toggleBranch(branch.id)}
                    aria-label={branchCollapsed ? 'Expand branch' : 'Collapse branch'}
                  >
                    {branchCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <OrgChartBranchNode
                    name={branch.name}
                    code={branch.code}
                    employeeCount={branch.employeeCount}
                  />
                </div>

                {!branchCollapsed ? (
                  <>
                    {branch.branchHead ? (
                      <>
                        <OrgChartConnector />
                        <OrgChartEmployeeCard employee={branch.branchHead} variant="leader" />
                      </>
                    ) : null}

                    {branch.departments.length > 0 ? (
                      <>
                        <OrgChartConnector />
                        <OrgChartHorizontalRail childCount={branch.departments.length} />
                      </>
                    ) : null}

                    <div className="flex items-start justify-center gap-4">
                      {branch.departments.map((department) => {
                        const deptCollapsed = collapsedDepartments.has(department.id);

                        return (
                          <div key={department.id} className="flex flex-col items-center">
                            {branch.departments.length > 1 ? (
                              <div className="h-6 w-px bg-border" aria-hidden />
                            ) : null}

                            <div className="relative">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute -left-7 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                                onClick={() => toggleDepartment(department.id)}
                                aria-label={
                                  deptCollapsed ? 'Expand department' : 'Collapse department'
                                }
                              >
                                {deptCollapsed ? (
                                  <ChevronRight className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <OrgChartDepartmentNode
                                name={department.name}
                                code={department.code}
                                employeeCount={department.employeeCount}
                              />
                            </div>

                            {!deptCollapsed ? (
                              <>
                                {department.employeeCount > 0 ? <OrgChartConnector /> : null}
                                <DepartmentEmployees department={department} />
                              </>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function OrgChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        Company
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm border bg-card" />
        Branch
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm border bg-muted/40" />
        Department
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-sky-500/30" />
        Employee
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-primary/40 ring-1 ring-primary/40" />
        Branch manager
      </span>
    </div>
  );
}

export function orgChartCanvasClassName(className?: string) {
  return cn(
    'overflow-x-auto rounded-xl border bg-gradient-to-b from-muted/30 via-background to-background p-6',
    className,
  );
}
