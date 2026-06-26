import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, LogOut, Scale, Wallet } from 'lucide-react';
import { LeaveExitNav, LeaveExitPageHeader } from '@/features/leave-exit/components/leave-exit-nav';
import { useLeaveBalances, useLeaveRequests, useResignations } from '@/features/leave-exit/hooks/use-leave-exit';
import { useApprovalInbox } from '@/features/approval/hooks/use-approval';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

export function LeaveExitDashboardPage() {
  const { data: balances, isLoading: balancesLoading } = useLeaveBalances();
  const { data: requests, isLoading: requestsLoading } = useLeaveRequests({ pageSize: 5 });
  const { data: inbox, isLoading: inboxLoading } = useApprovalInbox({ pageSize: 5 });
  const { data: resignations, isLoading: resignationsLoading } = useResignations();

  if (balancesLoading || requestsLoading || inboxLoading || resignationsLoading) {
    return <Loading message="Loading leave & exit overview..." />;
  }

  const pendingApprovals = inbox?.items.length ?? 0;
  const pendingLeave = requests?.items.filter((r) => r.status === 'pending').length ?? 0;
  const totalAvailable = (balances ?? []).reduce((sum, b) => sum + b.available, 0);
  const activeResignation = (resignations ?? []).find((r) => !['withdrawn', 'rejected', 'completed'].includes(r.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <LeaveExitPageHeader title="Leave & Exit" description="Policies, balances, approvals, resignation, and exit clearance." />
        <Button asChild>
          <Link to={ROUTES.LEAVE_APPLY}>Apply Leave</Link>
        </Button>
      </div>
      <LeaveExitNav />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Available Leave Days" value={String(totalAvailable)} />
        <StatCard icon={ClipboardList} label="Pending Leave Requests" value={String(pendingLeave)} />
        <StatCard icon={Scale} label="Pending Approvals" value={String(pendingApprovals)} />
        <StatCard icon={LogOut} label="Resignation Status" value={activeResignation?.status ?? 'None'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent Leave Requests</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.LEAVE_REQUESTS}>View all</Link>
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {(requests?.items ?? []).length === 0 ? (
              <li className="text-muted-foreground">No leave requests yet</li>
            ) : (
              (requests?.items ?? []).map((item) => (
                <li key={item.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                  <span>{new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}</span>
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
            <Button variant="outline" size="sm" asChild><Link to={ROUTES.LEAVE_CALENDAR}>Leave Calendar</Link></Button>
            <Button variant="outline" size="sm" asChild><Link to={ROUTES.LEAVE_BALANCES}>Balances</Link></Button>
            <Button variant="outline" size="sm" asChild><Link to={ROUTES.APPROVAL_INBOX}>Approval Inbox</Link></Button>
            <Button variant="outline" size="sm" asChild><Link to={ROUTES.EXIT}>Exit Progress</Link></Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
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
