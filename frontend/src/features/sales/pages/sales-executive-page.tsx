import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Phone, Target, TrendingUp, User } from 'lucide-react';
import { LeadActivityForm } from '@/features/sales/components/lead-activity-form';
import { LeadPipelineBoard } from '@/features/sales/components/lead-pipeline-board';
import {
  useActivities,
  useCallLogs,
  useCompleteFollowUp,
  useExecutiveSalesDashboard,
  useFollowUps,
  useMyLeads,
} from '@/features/sales/hooks/use-sales';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import type { Lead } from '@/features/sales/api/sales.api';

const TABS = ['My Leads', 'Follow-ups', 'Calls', 'Pipeline', 'Activity'] as const;

export function SalesExecutivePage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('My Leads');
  const today = new Date().toISOString().split('T')[0] ?? '';

  const { data: dashboard, isLoading: dashboardLoading } = useExecutiveSalesDashboard();
  const { data: myLeads, isLoading: leadsLoading } = useMyLeads({ pageSize: 50 });
  const { data: followUps, isLoading: followUpsLoading } = useFollowUps({ pageSize: 30 });
  const { data: callLogs, isLoading: callsLoading } = useCallLogs({ pageSize: 30 });
  const { data: activities, isLoading: activitiesLoading } = useActivities({ pageSize: 30 });

  const completeFollowUp = useCompleteFollowUp();

  if (dashboardLoading) {
    return <Loading message="Loading my sales dashboard..." />;
  }

  const todayFollowUps = (followUps?.items ?? []).filter((f) => f.scheduledAt.startsWith(today));
  const todayCalls = (callLogs?.items ?? []).filter((c) => c.calledAt.startsWith(today));
  const todayMeetings = (activities?.items ?? []).filter(
    (a) => a.type === 'meeting' && a.performedAt.startsWith(today),
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <User className="h-5 w-5" />
          <h1 className="text-2xl font-bold">My Sales</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage your leads, follow-ups, calls, and pipeline.</p>
      </div>

      {dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={User} label="My Leads" value={dashboard.myLeads} />
          <StatCard icon={Clock} label="Open Leads" value={dashboard.openLeads} />
          <StatCard icon={Calendar} label="Follow-ups Today" value={dashboard.followUpsToday} />
          <StatCard icon={Phone} label="Calls Today" value={dashboard.callsToday} />
          <StatCard icon={Calendar} label="Meetings Today" value={dashboard.meetingsToday} />
          <StatCard icon={TrendingUp} label="Won This Month" value={dashboard.wonThisMonth} />
          {dashboard.targetProgress != null ? (
            <StatCard icon={Target} label="Target Progress" value={`${dashboard.targetProgress}%`} />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'My Leads' ? (
        <section className="rounded-lg border bg-card p-6">
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
              { key: 'email', header: 'Email' },
              { key: 'status', header: 'Status', render: (row: Lead) => <span className="capitalize">{row.status}</span> },
              {
                key: 'estimatedValue',
                header: 'Value',
                render: (row: Lead) => (row.estimatedValue != null ? `${row.currency ?? 'INR'} ${row.estimatedValue.toLocaleString()}` : '—'),
              },
              {
                key: 'lastActivityAt',
                header: 'Last Activity',
                render: (row: Lead) => (row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleDateString() : '—'),
              },
            ]}
            data={myLeads?.items ?? []}
            isLoading={leadsLoading}
            emptyMessage="No leads assigned to you"
          />
        </section>
      ) : null}

      {activeTab === 'Follow-ups' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="font-semibold">Today&apos;s Follow-ups ({todayFollowUps.length})</h2>
          <DataTable
            columns={[
              {
                key: 'leadId',
                header: 'Lead',
                render: (row) =>
                  row.leadId ? (
                    <Link to={ROUTES.salesLeadDetail(row.leadId)} className="hover:underline">
                      View Lead
                    </Link>
                  ) : (
                    '—'
                  ),
              },
              { key: 'scheduledAt', header: 'Scheduled', render: (row) => new Date(row.scheduledAt).toLocaleString() },
              { key: 'notes', header: 'Notes', render: (row) => row.notes ?? '—' },
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
            data={followUps?.items ?? []}
            isLoading={followUpsLoading}
            emptyMessage="No follow-ups scheduled"
          />
        </section>
      ) : null}

      {activeTab === 'Calls' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="font-semibold">Call Log ({todayCalls.length} today)</h2>
          <DataTable
            columns={[
              {
                key: 'leadId',
                header: 'Lead',
                render: (row) =>
                  row.leadId ? (
                    <Link to={ROUTES.salesLeadDetail(row.leadId)} className="hover:underline">
                      View Lead
                    </Link>
                  ) : (
                    '—'
                  ),
              },
              { key: 'direction', header: 'Direction', render: (row) => <span className="capitalize">{row.direction}</span> },
              { key: 'durationSeconds', header: 'Duration (s)' },
              { key: 'outcome', header: 'Outcome', render: (row) => row.outcome ?? '—' },
              { key: 'calledAt', header: 'Called At', render: (row) => new Date(row.calledAt).toLocaleString() },
            ]}
            data={callLogs?.items ?? []}
            isLoading={callsLoading}
            emptyMessage="No calls logged"
          />
        </section>
      ) : null}

      {activeTab === 'Pipeline' ? (
        <section className="rounded-lg border bg-card p-6">
          <LeadPipelineBoard />
        </section>
      ) : null}

      {activeTab === 'Activity' ? (
        <section className="space-y-4">
          {myLeads?.items[0] ? (
            <LeadActivityForm leadId={myLeads.items[0].id} />
          ) : (
            <p className="text-sm text-muted-foreground">Select a lead from My Leads to log activity on its detail page.</p>
          )}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Recent Activity</h2>
            <DataTable
              columns={[
                { key: 'type', header: 'Type', render: (row) => <span className="capitalize">{row.type.replace(/_/g, ' ')}</span> },
                { key: 'title', header: 'Title', render: (row) => row.title ?? '—' },
                { key: 'description', header: 'Description' },
                { key: 'performedAt', header: 'When', render: (row) => new Date(row.performedAt).toLocaleString() },
              ]}
              data={activities?.items ?? []}
              isLoading={activitiesLoading}
              emptyMessage="No recent activity"
            />
          </div>
          {todayMeetings.length > 0 ? (
            <p className="text-sm text-muted-foreground">{todayMeetings.length} meeting(s) logged today.</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
