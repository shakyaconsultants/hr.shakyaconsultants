import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Target, TrendingDown, TrendingUp, Users, XCircle } from 'lucide-react';
import { LeadAssignmentDialog } from '@/features/sales/components/lead-assignment-dialog';
import {
  useCompleteFollowUp,
  useDeals,
  useFollowUps,
  useManagerSalesDashboard,
  useTeamLeads,
} from '@/features/sales/hooks/use-sales';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import type { Lead } from '@/features/sales/api/sales.api';

export function SalesManagerPage() {
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);

  const { data: dashboard, isLoading: dashboardLoading } = useManagerSalesDashboard();
  const { data: teamLeads, isLoading: leadsLoading } = useTeamLeads({ pageSize: 50 });
  const { data: followUps, isLoading: followUpsLoading } = useFollowUps({ pageSize: 30 });
  const { data: wonDeals } = useDeals({ status: 'won', pageSize: 20 });
  const { data: lostDeals } = useDeals({ status: 'lost', pageSize: 20 });

  const completeFollowUp = useCompleteFollowUp();

  if (dashboardLoading) {
    return <Loading message="Loading team sales dashboard..." />;
  }

  const pendingFollowUps = (followUps?.items ?? []).filter((f) => f.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Sales Team Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">Monitor team leads, assignments, performance, and follow-ups.</p>
        </div>
      </div>

      {dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Team Leads" value={dashboard.teamLeads} />
          <StatCard icon={Clock} label="Open Leads" value={dashboard.openLeads} />
          <StatCard icon={TrendingUp} label="Won This Month" value={dashboard.wonThisMonth} />
          <StatCard icon={TrendingDown} label="Lost This Month" value={dashboard.lostThisMonth} />
          <StatCard icon={Clock} label="Pending Follow-ups" value={dashboard.pendingFollowUps} />
          <StatCard icon={Target} label="Overdue Follow-ups" value={dashboard.overdueFollowUps} />
          {dashboard.teamTargetProgress != null ? (
            <StatCard icon={Target} label="Target Progress" value={`${dashboard.teamTargetProgress}%`} />
          ) : null}
        </div>
      ) : null}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Team Leads</h2>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Lead',
              render: (row: Lead) => (
                <Link to={ROUTES.salesLeadDetail(row.id)} className="font-medium hover:underline">
                  {row.firstName} {row.lastName}
                </Link>
              ),
            },
            { key: 'company', header: 'Company', render: (row: Lead) => row.company ?? '—' },
            { key: 'status', header: 'Status', render: (row: Lead) => <span className="capitalize">{row.status}</span> },
            { key: 'assignedToName', header: 'Assigned To', render: (row: Lead) => row.assignedToName ?? row.assignedToId ?? 'Unassigned' },
            {
              key: 'estimatedValue',
              header: 'Value',
              render: (row: Lead) => (row.estimatedValue != null ? `${row.currency ?? 'INR'} ${row.estimatedValue.toLocaleString()}` : '—'),
            },
            {
              key: 'actions',
              header: '',
              render: (row: Lead) => (
                <Button variant="ghost" size="sm" onClick={() => setAssignLeadId(row.id)}>
                  Assign
                </Button>
              ),
            },
          ]}
          data={teamLeads?.items ?? []}
          isLoading={leadsLoading}
          emptyMessage="No team leads found"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold">Won Deals</h2>
          </div>
          <DataTable
            columns={[
              { key: 'name', header: 'Deal' },
              { key: 'value', header: 'Value', render: (row) => `${row.currency} ${row.value.toLocaleString()}` },
              { key: 'ownerName', header: 'Owner', render: (row) => row.ownerName ?? row.ownerId },
            ]}
            data={wonDeals?.items ?? []}
            emptyMessage="No won deals this period"
          />
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold">Lost Deals</h2>
          </div>
          <DataTable
            columns={[
              { key: 'name', header: 'Deal' },
              { key: 'lostReason', header: 'Reason', render: (row) => row.lostReason ?? '—' },
              { key: 'ownerName', header: 'Owner', render: (row) => row.ownerName ?? row.ownerId },
            ]}
            data={lostDeals?.items ?? []}
            emptyMessage="No lost deals this period"
          />
        </section>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Team Follow-ups</h2>
        <DataTable
          columns={[
            { key: 'leadId', header: 'Lead ID' },
            { key: 'assignedToName', header: 'Assigned To', render: (row) => row.assignedToName ?? row.assignedToId },
            {
              key: 'scheduledAt',
              header: 'Scheduled',
              render: (row) => new Date(row.scheduledAt).toLocaleString(),
            },
            { key: 'status', header: 'Status', render: (row) => <span className="capitalize">{row.status}</span> },
            {
              key: 'actions',
              header: '',
              render: (row) =>
                row.status === 'pending' ? (
                  <Button variant="ghost" size="sm" onClick={() => void completeFollowUp.mutateAsync(row.id)}>
                    Complete
                  </Button>
                ) : null,
            },
          ]}
          data={pendingFollowUps}
          isLoading={followUpsLoading}
          emptyMessage="No pending follow-ups"
        />
      </section>

      {assignLeadId ? (
        <LeadAssignmentDialog
          open={Boolean(assignLeadId)}
          leadId={assignLeadId}
          onClose={() => setAssignLeadId(null)}
          onSuccess={() => setAssignLeadId(null)}
        />
      ) : null}
    </div>
  );
}
