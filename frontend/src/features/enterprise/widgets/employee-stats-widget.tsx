import { Users } from 'lucide-react';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { StatCard } from '@/shared/components/stat-card';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function EmployeeStatsWidget() {
  const {
    data: allEmployees,
    isLoading: allLoading,
    isError: allError,
  } = useEmployees({
    page: 1,
    pageSize: 1,
  });
  const { data: activeEmployees, isLoading: activeLoading } = useEmployees({
    page: 1,
    pageSize: 1,
    status: 'active',
  });

  if (allLoading || activeLoading) {
    return <WidgetSkeleton title="Employee Statistics" />;
  }

  if (allError) {
    return <p className="text-sm text-destructive">Unable to load employee statistics.</p>;
  }

  const total = allEmployees?.pagination?.total ?? 0;
  const active = activeEmployees?.pagination?.total ?? 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatCard icon={Users} label="Total Employees" value={total} />
      <StatCard icon={Users} label="Active" value={active} hint="Active employment records" />
    </div>
  );
}
