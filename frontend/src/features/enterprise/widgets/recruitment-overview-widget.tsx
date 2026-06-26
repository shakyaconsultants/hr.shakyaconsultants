import { Link } from 'react-router-dom';
import { Briefcase, FileText, TrendingUp } from 'lucide-react';
import { useRecruitmentDashboard } from '@/features/recruitment/hooks/use-recruitment';
import { ROUTES } from '@/config/app.config';
import { StatCard } from '@/shared/components/stat-card';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function RecruitmentOverviewWidget() {
  const { data, isLoading, isError } = useRecruitmentDashboard();

  if (isLoading) {
    return <WidgetSkeleton title="Recruitment Overview" />;
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Unable to load recruitment overview.</p>;
  }

  const activePipeline = Object.values(data.pipelineOverview).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Briefcase} label="Active Pipeline" value={activePipeline} />
        <StatCard icon={FileText} label="Offers Pending" value={data.offersPending.length} />
        <StatCard icon={TrendingUp} label="Conversion" value={`${data.conversionRate}%`} />
      </div>
      <Link to={ROUTES.RECRUITMENT} className="text-sm font-medium text-primary hover:underline">
        Open recruitment dashboard
      </Link>
    </div>
  );
}
