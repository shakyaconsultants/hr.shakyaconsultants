import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useArchiveNotification } from '@/features/workspace/hooks/use-workspace';
import { WorkspaceNav, WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { useState } from 'react';

export function WorkspaceNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const params = filter === 'unread' ? { isRead: false } : filter === 'archived' ? { isArchived: true } : {};
  const { data, isLoading } = useNotifications(params);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const archive = useArchiveNotification();

  if (isLoading) return <Loading message="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Notification Center" description="Grouped notifications with read, archive, and deep links." />
      <WorkspaceNav />

      <div className="flex flex-wrap gap-2">
        {(['all', 'unread', 'archived'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>{f}</Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => markAll.mutate()}>Mark all read</Button>
      </div>

      {(data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {data?.items.map((n) => (
            <li key={n.id} className={`flex items-start justify-between gap-4 px-4 py-4 ${!n.readAt ? 'bg-primary/5' : ''}`}>
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                {n.category && <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs">{n.category}</span>}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!n.readAt && <Button size="sm" variant="outline" onClick={() => markRead.mutate(n.id)}>Read</Button>}
                {!n.isArchived && <Button size="sm" variant="ghost" onClick={() => archive.mutate(n.id)}>Archive</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
