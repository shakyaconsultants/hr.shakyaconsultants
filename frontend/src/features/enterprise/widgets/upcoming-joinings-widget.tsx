import { useRecruitmentDashboard } from '@/features/recruitment/hooks/use-recruitment';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function UpcomingJoiningsWidget() {
  const { data, isLoading, isError } = useRecruitmentDashboard();

  if (isLoading) {
    return <WidgetSkeleton title="Upcoming Joinings" />;
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Unable to load joinings.</p>;
  }

  const joinings = data.joiningThisWeek ?? [];

  if (joinings.length === 0) {
    return <p className="text-sm text-muted-foreground">No upcoming joinings scheduled.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {joinings.slice(0, 5).map((entry) => (
        <li key={entry.id} className="border-b pb-2 last:border-0">
          {`${entry.firstName} ${entry.lastName}`.trim()}
        </li>
      ))}
    </ul>
  );
}
