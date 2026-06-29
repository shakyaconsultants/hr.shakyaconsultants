import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, Scale, Users } from 'lucide-react';
import { LeaveExitNav, LeaveExitPageHeader } from '@/features/leave-exit/components/leave-exit-nav';
import { useLeavePolicies, useLeaveRequests } from '@/features/leave-exit/hooks/use-leave-exit';
import { useApprovalInbox } from '@/features/approval/hooks/use-approval';
import { useResolvedPortal } from '@/app/hooks/use-resolved-portal';
import { PORTAL } from '@/config/portals';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { Navigate } from 'react-router-dom';
import { Loading } from '@/shared/components/loading';

export function LeaveExitDashboardPage() {
  const portal = useResolvedPortal();
  const { data: policies, isLoading: policiesLoading } = useLeavePolicies();
  const { data: requests, isLoading: requestsLoading } = useLeaveRequests({ pageSize: 10 });
  const { data: inbox, isLoading: inboxLoading } = useApprovalInbox({ pageSize: 5 });

  if (portal === PORTAL.WORKSPACE) {
    return <Navigate to={ROUTES.WORKSPACE} replace />;
  }

  if (policiesLoading || requestsLoading || inboxLoading) {
    return <Loading message="Loading leave management dashboard..." />;
  }

  const pendingLeave = requests?.items.filter((r) => r.status === 'pending').length ?? 0;
  const pendingApprovals = inbox?.items.length ?? 0;
  const activePolicies = policies?.filter((p) => p.status === 'active').length ?? 0;
  const isAdmin = portal === PORTAL.ENTERPRISE;

  return (
    <div className="space-y-6">
      <LeaveExitPageHeader
        title={isAdmin ? 'Leave Management' : 'Team Leave Management'}
        description={
          isAdmin
            ? 'Company-wide leave requests, balances, policies, and exit clearance.'
            : 'Review team leave requests and pending approvals.'
        }
      />
      <LeaveExitNav />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Pending Leave Requests" value={String(pendingLeave)} />
        <StatCard icon={Scale} label="Pending Approvals" value={String(pendingApprovals)} />
        {isAdmin ? (
          <StatCard icon={Users} label="Active Leave Policies" value={String(activePolicies)} />
        ) : (
          <StatCard icon={CalendarDays} label="Team Calendar" value="View" />
        )}
        <StatCard icon={CalendarDays} label="Recent Requests" value={String(requests?.items.length ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{isAdmin ? 'Recent Leave Requests' : 'Recent Team Requests'}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.LEAVE_REQUESTS}>View all</Link>
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {(requests?.items ?? []).length === 0 ? (
              <li className="text-muted-foreground">No leave requests</li>
            ) : (
              (requests?.items ?? []).slice(0, 5).map((item) => (
                <li key={item.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                  <span>
                    {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                  </span>
                  <span className="capitalize text-muted-foreground">{item.status}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <h2 className="font-semibold">Quick Links</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.LEAVE_REQUESTS}>{isAdmin ? 'All Requests' : 'Pending Requests'}</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.LEAVE_CALENDAR}>{isAdmin ? 'Leave Calendar' : 'Team Calendar'}</Link>
            </Button>
            {isAdmin ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.LEAVE_BALANCES}>All Balances</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.LEAVE_POLICIES}>Policies & Rules</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.EXIT}>Exit Management</Link>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to={ROUTES.APPROVAL_INBOX}>Approval Inbox</Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold capitalize">{value}</p>
    </div>
  );
}
