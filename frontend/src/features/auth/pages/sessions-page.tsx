import { useQuery } from '@tanstack/react-query';
import { fetchSessions, revokeSessionRequest } from '@/features/auth/api/auth.api';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';

export function SessionsPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['auth', 'sessions'], queryFn: fetchSessions });

  if (isLoading) return <Loading message="Loading sessions..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Active sessions</h1>
        <p className="text-sm text-muted-foreground">Manage devices where your account is signed in.</p>
      </div>
      <div className="space-y-3">
        {(data ?? []).length === 0 ? (
          <p className="text-muted-foreground">No active sessions.</p>
        ) : (
          (data ?? []).map((session) => (
            <div key={session.sessionId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <p className="font-medium">
                  {session.deviceName ?? `${session.browser ?? 'Browser'} on ${session.os ?? 'Unknown OS'}`}
                  {session.isCurrent ? ' (Current)' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.ipAddress} · Last active {new Date(session.lastActiveAt).toLocaleString()}
                </p>
              </div>
              {!session.isCurrent ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void revokeSessionRequest(session.sessionId).then(() => refetch())}
                >
                  Sign out device
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
