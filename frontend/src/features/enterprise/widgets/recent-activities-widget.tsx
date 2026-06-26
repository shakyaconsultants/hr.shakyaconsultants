import { useActivity } from '@/features/workspace/hooks/use-workspace';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function RecentActivitiesWidget() {
  const { data, isLoading, isError } = useActivity({ page: 1, pageSize: 5 });

  if (isLoading) {
    return <WidgetSkeleton title="Recent Activities" />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to load activities.</p>;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent company activity.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.id} className="border-b pb-2 last:border-0">
          <p className="font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.activityType}</p>
        </li>
      ))}
    </ul>
  );
}
