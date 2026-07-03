import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, UserMinus, UserPlus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignEmployeeManager,
  endEmployeeManagerRelationship,
  fetchEmployeeDirectReports,
  fetchEmployeeManagers,
  type DirectReport,
  type ReportingRelationship,
} from '@/features/employee/api/employee.api';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';

interface EmployeeReportingPanelProps {
  employeeId: string;
  employeeName: string;
}

export function EmployeeReportingPanel({ employeeId, employeeName }: EmployeeReportingPanelProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('employee.managers.manage');
  const queryClient = useQueryClient();
  const [managerPickId, setManagerPickId] = useState('');
  const [reportPickId, setReportPickId] = useState('');

  const { data: managers, isLoading: managersLoading } = useQuery({
    queryKey: ['employee', employeeId, 'managers'],
    queryFn: () => fetchEmployeeManagers(employeeId),
    enabled: Boolean(employeeId),
  });

  const { data: directReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['employee', employeeId, 'direct-reports'],
    queryFn: () => fetchEmployeeDirectReports(employeeId),
    enabled: Boolean(employeeId),
  });

  const { data: allEmployees } = useEmployees({ page: 1, pageSize: 500 });

  const employeeOptions = useMemo(
    () =>
      (allEmployees?.items ?? [])
        .filter((e) => e.id !== employeeId)
        .map((e) => ({
          value: e.id,
          label: `${e.firstName} ${e.lastName}`.trim(),
        })),
    [allEmployees?.items, employeeId],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    void queryClient.invalidateQueries({ queryKey: ['employees', 'reporting-tree'] });
  };

  const assignManagerMutation = useAppMutation({
    mutationFn: () => assignEmployeeManager(employeeId, { managerId: managerPickId }),
    successMessage: 'Manager assigned successfully',
    onSuccess: () => {
      setManagerPickId('');
      invalidate();
    },
  });

  const assignReportMutation = useAppMutation({
    mutationFn: () => assignEmployeeManager(reportPickId, { managerId: employeeId }),
    successMessage: 'Team member assigned successfully',
    onSuccess: () => {
      setReportPickId('');
      invalidate();
    },
  });

  const removeManagerMutation = useAppMutation({
    mutationFn: (relationshipId: string) => endEmployeeManagerRelationship(employeeId, relationshipId),
    successMessage: 'Manager relationship removed',
    onSuccess: invalidate,
  });

  const removeReportMutation = useAppMutation({
    mutationFn: ({ reportEmployeeId, relationshipId }: { reportEmployeeId: string; relationshipId: string }) =>
      endEmployeeManagerRelationship(reportEmployeeId, relationshipId),
    successMessage: 'Team member unassigned',
    onSuccess: invalidate,
  });

  if (managersLoading || reportsLoading) {
    return <Loading message="Loading reporting hierarchy..." />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <GitBranch className="h-4 w-4 text-primary" />
          Reporting hierarchy for {employeeName}
        </div>
        <p className="mt-1">
          Assign any employee as manager or direct report — no department or designation restrictions.
          Changes appear on the organization reporting chart and employee position views.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="font-semibold">Reports to (Managers)</h3>
        {(managers ?? []).length === 0 ? (
          <EmptyState title="No manager assigned" description="This employee is at the top of their reporting line." />
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {(managers ?? []).map((rel) => (
              <ManagerRow
                key={rel.id}
                relationship={rel}
                canManage={canManage}
                onRemove={() => void removeManagerMutation.mutateAsync(rel.id)}
                isRemoving={removeManagerMutation.isPending}
              />
            ))}
          </ul>
        )}
        {canManage ? (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-4">
            <div className="min-w-[280px] flex-1">
              <p className="mb-2 text-sm font-medium">Assign manager</p>
              <AsyncSearchSelect
                value={managerPickId}
                options={employeeOptions}
                placeholder="Select manager…"
                onChange={setManagerPickId}
              />
            </div>
            <Button
              disabled={!managerPickId || assignManagerMutation.isPending}
              onClick={() => void assignManagerMutation.mutateAsync()}
            >
              <UserPlus className="mr-1 h-4 w-4" />
              Assign Manager
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Direct reports (team under {employeeName.split(' ')[0]})</h3>
        {(directReports ?? []).length === 0 ? (
          <EmptyState title="No direct reports" description="Assign employees who report to this person." />
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {(directReports ?? []).map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                canManage={canManage}
                onRemove={() =>
                  void removeReportMutation.mutateAsync({
                    reportEmployeeId: report.id,
                    relationshipId: report.relationshipId,
                  })
                }
                isRemoving={removeReportMutation.isPending}
              />
            ))}
          </ul>
        )}
        {canManage ? (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-4">
            <div className="min-w-[280px] flex-1">
              <p className="mb-2 text-sm font-medium">Add employee under {employeeName.split(' ')[0]}</p>
              <AsyncSearchSelect
                value={reportPickId}
                options={employeeOptions}
                placeholder="Select team member…"
                onChange={setReportPickId}
              />
            </div>
            <Button
              disabled={!reportPickId || assignReportMutation.isPending}
              onClick={() => void assignReportMutation.mutateAsync()}
            >
              <UserPlus className="mr-1 h-4 w-4" />
              Assign Report
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ManagerRow({
  relationship,
  canManage,
  onRemove,
  isRemoving,
}: {
  relationship: ReportingRelationship;
  canManage: boolean;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const manager = relationship.manager;
  const name = manager ? `${manager.firstName} ${manager.lastName}`.trim() : relationship.managerId;

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <div className="min-w-0">
        {manager ? (
          <Link to={ROUTES.employeeDetail(manager.id)} className="font-medium text-primary hover:underline">
            {name}
          </Link>
        ) : (
          <p className="font-medium">{name}</p>
        )}
        <p className="text-xs text-muted-foreground capitalize">
          {relationship.relationshipType.replace(/_/g, ' ')}
          {relationship.isPrimary ? ' · Primary' : ''}
        </p>
      </div>
      {canManage ? (
        <Button variant="ghost" size="sm" disabled={isRemoving} onClick={onRemove}>
          <UserMinus className="mr-1 h-4 w-4" />
          Remove
        </Button>
      ) : null}
    </li>
  );
}

function ReportRow({
  report,
  canManage,
  onRemove,
  isRemoving,
}: {
  report: DirectReport;
  canManage: boolean;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const name = `${report.firstName} ${report.lastName}`.trim();

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <div className="min-w-0">
        <Link to={ROUTES.employeeDetail(report.id)} className="font-medium text-primary hover:underline">
          {name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {report.designationName ?? report.jobTitle ?? report.email}
        </p>
      </div>
      {canManage ? (
        <Button variant="ghost" size="sm" disabled={isRemoving} onClick={onRemove}>
          <UserMinus className="mr-1 h-4 w-4" />
          Unassign
        </Button>
      ) : null}
    </li>
  );
}
