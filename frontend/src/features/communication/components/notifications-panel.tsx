import { useState } from 'react';
import {
  useCommunicationNotifications,
  useMarkAllCommunicationNotificationsRead,
  useMarkCommunicationNotificationRead,
  useArchiveCommunicationNotification,
} from '@/features/communication/hooks/use-communication';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

export function NotificationsPanel() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const params =
    filter === 'unread'
      ? { isRead: false, pageSize: 50 }
      : filter === 'archived'
        ? { isArchived: true, pageSize: 50 }
        : { pageSize: 50 };

  const { data, isLoading } = useCommunicationNotifications(params);
  const markRead = useMarkCommunicationNotificationRead();
  const markAll = useMarkAllCommunicationNotificationsRead();
  const archive = useArchiveCommunicationNotification();

  if (isLoading) {
    return <Loading message="Loading notifications…" />;
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'unread', 'archived'] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? 'default' : 'outline'}
            onClick={() => setFilter(value)}
          >
            {value}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => markAll.mutate()}>
          Mark all read
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((notification) => (
            <li
              key={notification.id}
              className={`flex items-start justify-between gap-4 px-4 py-4 ${
                !notification.readAt ? 'bg-primary/5' : ''
              }`}
            >
              <div>
                <p className="font-medium">{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.body}</p>
                {notification.category ? (
                  <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs">
                    {notification.category}
                  </span>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!notification.readAt ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markRead.mutate(notification.id)}
                  >
                    Read
                  </Button>
                ) : null}
                {!notification.isArchived ? (
                  <Button size="sm" variant="ghost" onClick={() => archive.mutate(notification.id)}>
                    Archive
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
