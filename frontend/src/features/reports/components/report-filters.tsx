import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ReportFilterParams } from '@/features/reports/api/reports.api';
import { MASTER_ENTITIES } from '@/features/organization/constants/entity-catalog';
import { listEntities } from '@/features/organization/api/organization.api';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { useProjects } from '@/features/project/hooks/use-projects';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export interface ReportFiltersProps {
  value: ReportFilterParams;
  onChange: (filters: ReportFilterParams) => void;
  onApply?: () => void;
  showSearch?: boolean;
  showBranch?: boolean;
  showDepartment?: boolean;
  showProject?: boolean;
  showEmployee?: boolean;
  className?: string;
}

function defaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0] ?? '',
    endDate: end.toISOString().split('T')[0] ?? '',
  };
}

export function getDefaultReportFilters(): ReportFilterParams {
  return defaultDateRange();
}

export function ReportFilters({
  value,
  onChange,
  onApply,
  showSearch = true,
  showBranch = true,
  showDepartment = true,
  showProject = true,
  showEmployee = true,
  className,
}: ReportFiltersProps) {
  const [local, setLocal] = useState<ReportFilterParams>(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const { data: branches } = useQuery({
    queryKey: ['organization', 'branch', 'report-filters'],
    queryFn: () => listEntities(MASTER_ENTITIES.BRANCH, { pageSize: 200, status: 'active' }),
    enabled: showBranch,
  });

  const { data: departments } = useQuery({
    queryKey: ['organization', 'department', 'report-filters'],
    queryFn: () => listEntities(MASTER_ENTITIES.DEPARTMENT, { pageSize: 200, status: 'active' }),
    enabled: showDepartment,
  });

  const { data: employees } = useEmployees({ pageSize: 200, status: 'active' });
  const { data: projects } = useProjects({ pageSize: 200, status: 'active' });

  const update = (patch: Partial<ReportFilterParams>) => {
    setLocal((prev) => ({ ...prev, ...patch }));
  };

  const handleApply = () => {
    onChange(local);
    onApply?.();
  };

  const handleReset = () => {
    const defaults = getDefaultReportFilters();
    setLocal(defaults);
    onChange(defaults);
    onApply?.();
  };

  return (
    <div className={`grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 ${className ?? ''}`}>
      <Field label="Start Date">
        <input
          type="date"
          className="w-full rounded-md border p-2 text-sm"
          value={local.startDate ?? ''}
          onChange={(e) => update({ startDate: e.target.value })}
        />
      </Field>

      <Field label="End Date">
        <input
          type="date"
          className="w-full rounded-md border p-2 text-sm"
          value={local.endDate ?? ''}
          onChange={(e) => update({ endDate: e.target.value })}
        />
      </Field>

      {showBranch ? (
        <Field label="Branch">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={local.branchId ?? ''}
            onChange={(e) => update({ branchId: e.target.value || undefined })}
          >
            <option value="">All branches</option>
            {branches?.items.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {showDepartment ? (
        <Field label="Department">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={local.departmentId ?? ''}
            onChange={(e) => update({ departmentId: e.target.value || undefined })}
          >
            <option value="">All departments</option>
            {departments?.items.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {showProject ? (
        <Field label="Project">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={local.projectId ?? ''}
            onChange={(e) => update({ projectId: e.target.value || undefined })}
          >
            <option value="">All projects</option>
            {projects?.items.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {showEmployee ? (
        <Field label="Employee">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={local.employeeId ?? ''}
            onChange={(e) => update({ employeeId: e.target.value || undefined })}
          >
            <option value="">All employees</option>
            {employees?.items.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {[employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.employeeNumber}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {showSearch ? (
        <Field label="Search">
          <Input
            placeholder="Search reports..."
            value={local.search ?? ''}
            onChange={(e) => update({ search: e.target.value || undefined })}
          />
        </Field>
      ) : null}

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="button" onClick={handleApply}>
          Apply Filters
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
