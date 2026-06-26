import type { NotificationRecord } from '@/features/communication/api/communication.api';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { Button } from '@/shared/components/ui/button';

interface NotificationListProps {
  notifications: NotificationRecord[];
  onMarkRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  emptyTitle?: string;
}

export function NotificationList({
  notifications,
  onMarkRead,
  onArchive,
  emptyTitle = 'No notifications',
}: NotificationListProps) {
  if (notifications.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={`flex items-start justify-between gap-4 px-4 py-4 ${!notification.readAt ? 'bg-primary/5' : ''}`}
        >
          <div>
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-muted-foreground">{notification.body}</p>
            {notification.category ? (
              <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs">{notification.category}</span>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {!notification.readAt && onMarkRead ? (
              <Button size="sm" variant="outline" onClick={() => onMarkRead(notification.id)}>
                Read
              </Button>
            ) : null}
            {!notification.isArchived && onArchive ? (
              <Button size="sm" variant="ghost" onClick={() => onArchive(notification.id)}>
                Archive
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
