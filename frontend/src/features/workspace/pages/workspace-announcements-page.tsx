import { useAnnouncements, useAcknowledgeAnnouncement } from '@/features/workspace/hooks/use-workspace';
import { WorkspaceNav, WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

export function WorkspaceAnnouncementsPage() {
  const { data, isLoading } = useAnnouncements();
  const acknowledge = useAcknowledgeAnnouncement();

  if (isLoading) return <Loading message="Loading announcements..." />;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Announcements" description="Company, department, and branch announcements with acknowledgements." />
      <WorkspaceNav />

      {(data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No announcements" />
      ) : (
        <ul className="space-y-4">
          {data?.items.map((a) => (
            <li key={a.id} className="rounded-lg border bg-card p-5">
              <div className="mb-2 flex items-center gap-2">
                {a.isPinned && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Pinned</span>}
                <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{a.priority}</span>
                {a.isRead && <span className="text-xs text-muted-foreground">Read</span>}
              </div>
              <h2 className="text-lg font-semibold">{a.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
              {!a.isAcknowledged && (
                <Button size="sm" className="mt-4" onClick={() => acknowledge.mutate(a.id)} disabled={acknowledge.isPending}>
                  Acknowledge
                </Button>
              )}
              {a.isAcknowledged && <p className="mt-3 text-xs text-green-600">Acknowledged</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
