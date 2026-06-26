import type { CalendarEvent } from '@/features/workspace/api/workspace.api';
import { useMemo } from 'react';
import { useCalendar } from '@/features/workspace/hooks/use-workspace';
import { WorkspaceNav, WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

export function WorkspaceCalendarPage() {
  const now = new Date();
  const start = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0];
  }, [now]);
  const end = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return d.toISOString().split('T')[0];
  }, [now]);

  const { data, isLoading } = useCalendar(start, end);

  if (isLoading) return <Loading message="Loading calendar..." />;

  const eventsByDate = (data?.events ?? []).reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const key = new Date(event.date).toLocaleDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="My Calendar" description="Deadlines, holidays, birthdays, and interviews." />
      <WorkspaceNav />

      {Object.keys(eventsByDate).length === 0 ? (
        <EmptyState title="No events this month" />
      ) : (
        <div className="space-y-4">
          {Object.entries(eventsByDate).map(([date, events]) => (
            <section key={date} className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 font-semibold">{date}</h2>
              <ul className="space-y-2">
                {events?.map((event) => (
                  <li key={event.id} className="flex items-center gap-3 text-sm">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{event.type.replace(/_/g, ' ')}</span>
                    <span>{event.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
