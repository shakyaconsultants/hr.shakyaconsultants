import { useProjects } from '@/features/project/hooks/use-projects';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function ProjectsAtRiskWidget() {
  const { data, isLoading, isError } = useProjects({ page: 1, pageSize: 10, atRisk: true });

  if (isLoading) {
    return <WidgetSkeleton title="Projects At Risk" />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to load projects at risk.</p>;
  }

  const projects = data?.items ?? [];

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">No projects flagged as at risk.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {projects.slice(0, 5).map((project) => (
        <li key={project.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
          <span className="font-medium">{project.name}</span>
          <span className="text-muted-foreground">{project.status}</span>
        </li>
      ))}
    </ul>
  );
}
