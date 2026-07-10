import { Clock, Coffee, LogIn, LogOut } from 'lucide-react';
import { usePunch, useTodayAttendance } from '@/features/attendance/hooks/use-attendance';
import { useAuthStore } from '@/shared/stores/app.store';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';
import { cn } from '@/shared/utils/cn';

function formatTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMinutes(minutes?: number): string {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function PunchPanel() {
  const employeeId = useAuthStore((s) => s.user?.employeeId ?? s.employee?.id ?? '');
  const { data: today, isLoading } = useTodayAttendance(employeeId || undefined);
  const punchMutation = usePunch();

  if (!employeeId) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Your account is not linked to an employee record. Contact HR to enable attendance punch.
      </div>
    );
  }

  if (isLoading) {
    return <Loading message="Loading today's attendance..." />;
  }

  const hasCheckedIn = Boolean(today?.checkIn);
  const hasCheckedOut = Boolean(today?.checkOut);
  const isSessionOpen = hasCheckedIn && !hasCheckedOut;
  const onBreak = Boolean(today?.onBreak);

  const handlePunch = (type: 'check_in' | 'check_out' | 'break_start' | 'break_end') => {
    punchMutation.mutate({ type, employeeId });
  };

  const punchError = punchMutation.isError ? parseMutationError(punchMutation.error).message : null;

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Today's Attendance</h2>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Status"
          value={today?.status?.replace(/_/g, ' ') ?? 'Not punched'}
          capitalize
        />
        <Stat label="Check In" value={formatTime(today?.checkIn)} />
        <Stat label="Check Out" value={formatTime(today?.checkOut)} />
        <Stat label="Worked" value={formatMinutes(today?.workedMinutes)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <PunchButton
          icon={LogIn}
          label="Check In"
          disabled={isSessionOpen || hasCheckedOut || punchMutation.isPending}
          onClick={() => handlePunch('check_in')}
        />
        <PunchButton
          icon={LogOut}
          label="Check Out"
          disabled={!isSessionOpen || onBreak || punchMutation.isPending}
          onClick={() => handlePunch('check_out')}
        />
        <PunchButton
          icon={Coffee}
          label="Break Start"
          disabled={!isSessionOpen || onBreak || punchMutation.isPending}
          onClick={() => handlePunch('break_start')}
        />
        <PunchButton
          icon={Coffee}
          label="Break End"
          disabled={!onBreak || hasCheckedOut || punchMutation.isPending}
          onClick={() => handlePunch('break_end')}
        />
      </div>

      {punchError ? <p className="mt-3 text-sm text-destructive">{punchError}</p> : null}

      {today?.logs && today.logs.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Today's punches</h3>
          <ul className="space-y-2">
            {[...today.logs].reverse().map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2 text-sm"
              >
                <span className="capitalize">{log.type.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  <SourceBadge source={log.source} deviceCode={log.deviceCode} />
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SourceBadge({ source, deviceCode }: { source?: string; deviceCode?: string }) {
  const isExternal = source === 'external';
  const label = isExternal ? (deviceCode ? `Kiosk · ${deviceCode}` : 'Kiosk') : 'Manual';
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-xs font-medium',
        isExternal ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('font-medium', capitalize && 'capitalize')}>{value}</p>
    </div>
  );
}

function PunchButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" disabled={disabled} onClick={onClick} className="gap-2">
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
