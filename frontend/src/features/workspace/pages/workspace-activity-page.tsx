import { useActivity } from '@/features/workspace/hooks/use-workspace';
import { WorkspaceNav, WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

export function WorkspaceActivityPage() {
  const { data, isLoading } = useActivity();

  if (isLoading) return <Loading message="Loading activity..." />;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="My Activity" description="Complete timeline of tasks, projects, documents, and role changes." />
      <WorkspaceNav />

      {(data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <ol className="relative border-l pl-6">
          {data?.items.map((item) => (
            <li key={item.id} className="mb-6 ml-2">
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border bg-background border-primary" />
              <p className="text-sm font-medium">{item.title}</p>
              {item.description && item.description !== item.title && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {item.activityType} · {new Date(item.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
