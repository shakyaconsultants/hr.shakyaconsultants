import { cn } from '@/shared/utils/cn';

export function AttendanceStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'present'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15'
      : status === 'absent'
        ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15'
        : status === 'late'
          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15'
          : status === 'on_leave'
            ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15'
            : status === 'weekend'
              ? 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/15'
              : status === 'holiday'
                ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/15'
                : status === 'unmarked'
                  ? 'bg-muted text-muted-foreground ring-1 ring-inset ring-border'
                  : 'bg-muted text-muted-foreground ring-1 ring-inset ring-border';

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', tone)}>
      {status.replace(/_/g, ' ') === 'weekend' ? 'weekly off' : status.replace(/_/g, ' ')}
    </span>
  );
}

export function formatAttendanceTime(value?: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatWorkedMinutes(minutes?: number | null): string {
  if (minutes == null) {
    return '—';
  }
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
