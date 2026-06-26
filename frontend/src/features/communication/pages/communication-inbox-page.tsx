import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { NotificationList } from '@/features/communication/components/notification-list';
import {
  useInbox,
  useMarkCommunicationNotificationRead,
} from '@/features/communication/hooks/use-communication';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

const CATEGORIES = ['approval', 'payroll', 'attendance', 'leave', 'interview', 'assignment', 'system'] as const;

export function CommunicationInboxPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { data, isLoading } = useInbox({ pageSize: 50, search: search || undefined });
  const markRead = useMarkCommunicationNotificationRead();

  if (isLoading) {
    return <Loading message="Loading inbox..." />;
  }

  const filteredRecent =
    activeCategory === 'all'
      ? (data?.recent ?? [])
      : (data?.categories[activeCategory]?.items ?? []);

  const displayItems = search.trim()
    ? filteredRecent.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.body.toLowerCase().includes(search.toLowerCase()),
      )
    : filteredRecent;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Inbox className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Communication Inbox</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Internal inbox for system, approval, workflow, and module notifications.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Search inbox..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-sm text-muted-foreground">
          {data?.totalUnread ?? 0} unread of {data?.totalNotifications ?? 0}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={activeCategory === 'all' ? 'default' : 'outline'} onClick={() => setActiveCategory('all')}>
          All
        </Button>
        {CATEGORIES.map((cat) => {
          const catData = data?.categories[cat];
          return (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? 'default' : 'outline'}
              onClick={() => setActiveCategory(cat)}
            >
              {cat} {catData?.unread ? `(${catData.unread})` : ''}
            </Button>
          );
        })}
      </div>

      {activeCategory !== 'all' && data?.categories[activeCategory] ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total" value={data.categories[activeCategory].total} />
          <Stat label="Unread" value={data.categories[activeCategory].unread} />
        </div>
      ) : null}

      {displayItems.length === 0 ? (
        <EmptyState title="No inbox items" description="Try a different category or search term." />
      ) : (
        <NotificationList
          notifications={displayItems}
          onMarkRead={(id) => markRead.mutate(id)}
          emptyTitle="No inbox items"
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
