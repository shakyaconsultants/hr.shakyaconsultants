import { Link } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import { useManagerDashboard, useProjects } from '@/features/project/hooks/use-projects';
import { ROUTES } from '@/config/app.config';
import { StatCard } from '@/shared/components/stat-card';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function ProjectOverviewWidget() {
  const { data: dashboard, isLoading: dashboardLoading } = useManagerDashboard();
  const { data: projects, isLoading: projectsLoading } = useProjects({ page: 1, pageSize: 5 });

  if (dashboardLoading || projectsLoading) {
    return <WidgetSkeleton title="Project Overview" />;
  }

  const activeProjects = dashboard?.activeProjects ?? projects?.pagination?.total ?? 0;
  const openTasks = dashboard?.totalTasks ?? 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects} />
        <StatCard icon={FolderKanban} label="Open Tasks" value={openTasks} />
      </div>
      <Link to={ROUTES.PROJECTS} className="text-sm font-medium text-primary hover:underline">
        Open projects dashboard
      </Link>
    </div>
  );
}
