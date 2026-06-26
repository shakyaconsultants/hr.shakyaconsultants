import { useMemo } from 'react';
import type { CalendarEvent } from '@/features/leave-exit/api/leave-exit.api';
import { LeaveExitNav, LeaveExitPageHeader } from '@/features/leave-exit/components/leave-exit-nav';
import { useCompanyCalendar } from '@/features/leave-exit/hooks/use-leave-exit';
import { Loading } from '@/shared/components/loading';

export function LeaveCalendarPage() {
  const now = new Date();
  const start = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0] ?? '';
  }, [now]);
  const end = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return d.toISOString().split('T')[0] ?? '';
  }, [now]);

  const { data, isLoading } = useCompanyCalendar(start, end);

  if (isLoading) return <Loading message="Loading company calendar..." />;

  const eventsByDate = (data ?? []).reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const key = new Date(event.date).toLocaleDateString();
    if (!acc[key]) acc[key] = [];
    acc[key]?.push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <LeaveExitPageHeader
        title="Leave Calendar"
        description="Holidays, approved leave, birthdays, anniversaries, and company events."
      />
      <LeaveExitNav />

      {Object.keys(eventsByDate).length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">No events this month</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(eventsByDate).map(([date, events]) => (
            <section key={date} className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 font-semibold">{date}</h2>
              <ul className="space-y-2">
                {(events ?? []).map((event) => (
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
