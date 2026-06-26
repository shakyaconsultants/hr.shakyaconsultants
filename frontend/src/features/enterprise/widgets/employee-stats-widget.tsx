import { Users } from 'lucide-react';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { StatCard } from '@/shared/components/stat-card';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function EmployeeStatsWidget() {
  const { data, isLoading, isError } = useEmployees({ page: 1, pageSize: 1 });

  if (isLoading) {
    return <WidgetSkeleton title="Employee Statistics" />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to load employee statistics.</p>;
  }

  const total = data?.pagination?.total ?? data?.items?.length ?? 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatCard icon={Users} label="Total Employees" value={total} />
      <StatCard icon={Users} label="Active" value={total} hint="Company-wide headcount" />
    </div>
  );
}
