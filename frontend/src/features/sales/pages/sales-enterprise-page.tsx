import { useRef, useState } from 'react';
import { BarChart3, FileDown, FileUp, Layers, Settings, Target, TrendingUp, Users } from 'lucide-react';
import { LeadPipelineBoard } from '@/features/sales/components/lead-pipeline-board';
import { PipelineStageEditor } from '@/features/sales/components/pipeline-stage-editor';
import { SalesPolicyForm } from '@/features/sales/components/sales-policy-form';
import {
  useConversionAnalytics,
  useCreateLeadSource,
  useCreateSalesTarget,
  useCreateSalesTeam,
  useCreateTerritory,
  useEnterpriseSalesDashboard,
  useExportLeads,
  useImportLeads,
  useLeadSources,
  usePipelines,
  useRevenueAnalytics,
  useSalesTargets,
  useSalesTeams,
  useTerritories,
} from '@/features/sales/hooks/use-sales';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';

const TABS = ['Overview', 'Sources', 'Pipelines', 'Teams', 'Territories', 'Targets', 'Policies', 'Import/Export', 'Analytics'] as const;

function defaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0] ?? '',
    endDate: end.toISOString().split('T')[0] ?? '',
  };
}

export function SalesEnterprisePage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dates = defaultDateRange();

  const { data: dashboard, isLoading } = useEnterpriseSalesDashboard();
  const { data: sources, isLoading: sourcesLoading } = useLeadSources({ pageSize: 50 });
  const { data: pipelines, isLoading: pipelinesLoading } = usePipelines({ pageSize: 20 });
  const { data: teams, isLoading: teamsLoading } = useSalesTeams({ pageSize: 50 });
  const { data: territories, isLoading: territoriesLoading } = useTerritories({ pageSize: 50 });
  const { data: targets, isLoading: targetsLoading } = useSalesTargets({ pageSize: 50 });
  const { data: conversion } = useConversionAnalytics({ startDate: dates.startDate, endDate: dates.endDate });
  const { data: revenue } = useRevenueAnalytics({ startDate: dates.startDate, endDate: dates.endDate });

  const createSource = useCreateLeadSource();
  const createTeam = useCreateSalesTeam();
  const createTerritory = useCreateTerritory();
  const createTarget = useCreateSalesTarget();
  const importLeads = useImportLeads();
  const exportLeads = useExportLeads();

  const editingPipeline = pipelines?.items.find((p) => p.id === editingPipelineId);

  if (isLoading && activeTab === 'Overview') {
    return <Loading message="Loading sales admin..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <BarChart3 className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Sales CRM Administration</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure sources, pipelines, teams, territories, targets, and sales policies.
          </p>
        </div>
      </div>

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

      {activeTab === 'Overview' && dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Layers} label="Total Leads" value={dashboard.totalLeads} />
          <StatCard icon={TrendingUp} label="Open Leads" value={dashboard.openLeads} />
          <StatCard icon={Target} label="Won Deals" value={dashboard.wonDeals} />
          <StatCard icon={BarChart3} label="Conversion Rate" value={`${dashboard.conversionRate}%`} />
          <StatCard icon={Users} label="Active Teams" value={dashboard.activeTeams} />
          <StatCard icon={Settings} label="Overdue Follow-ups" value={dashboard.overdueFollowUps} />
        </div>
      ) : null}

      {activeTab === 'Sources' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Lead Sources</h2>
            <Button
              size="sm"
              onClick={() =>
                void createSource.mutateAsync({ name: 'New Source', code: `SRC-${Date.now()}`, description: '' })
              }
              disabled={createSource.isPending}
            >
              Add Source
            </Button>
          </div>
          <DataTable
            columns={[
              { key: 'code', header: 'Code' },
              { key: 'name', header: 'Name' },
              { key: 'description', header: 'Description', render: (row) => row.description ?? '—' },
              { key: 'status', header: 'Status', render: (row) => <span className="capitalize">{row.status}</span> },
            ]}
            data={sources?.items ?? []}
            isLoading={sourcesLoading}
            emptyMessage="No lead sources configured"
          />
        </section>
      ) : null}

      {activeTab === 'Pipelines' ? (
        <section className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">{editingPipeline ? 'Edit Pipeline' : 'Create Pipeline'}</h2>
            <PipelineStageEditor pipeline={editingPipeline} onSaved={() => setEditingPipelineId(null)} />
            {editingPipeline ? (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setEditingPipelineId(null)}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Existing Pipelines</h3>
            <DataTable
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'stages', header: 'Stages', render: (row) => row.stages?.length ?? 0 },
                { key: 'isDefault', header: 'Default', render: (row) => (row.isDefault ? 'Yes' : 'No') },
                {
                  key: 'actions',
                  header: '',
                  render: (row) => (
                    <Button variant="ghost" size="sm" onClick={() => setEditingPipelineId(row.id)}>
                      Edit
                    </Button>
                  ),
                },
              ]}
              data={pipelines?.items ?? []}
              isLoading={pipelinesLoading}
              emptyMessage="No pipelines configured"
            />
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Pipeline Preview</h3>
            <LeadPipelineBoard readOnly />
          </div>
        </section>
      ) : null}

      {activeTab === 'Teams' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Sales Teams</h2>
            <Button
              size="sm"
              onClick={() =>
                void createTeam.mutateAsync({
                  name: 'New Team',
                  code: `TEAM-${Date.now()}`,
                  managerEmployeeId: '',
                  memberEmployeeIds: [],
                })
              }
              disabled={createTeam.isPending}
            >
              Add Team
            </Button>
          </div>
          <DataTable
            columns={[
              { key: 'code', header: 'Code' },
              { key: 'name', header: 'Name' },
              { key: 'managerEmployeeId', header: 'Manager' },
              { key: 'memberEmployeeIds', header: 'Members', render: (row) => row.memberEmployeeIds?.length ?? 0 },
              { key: 'status', header: 'Status', render: (row) => <span className="capitalize">{row.status}</span> },
            ]}
            data={teams?.items ?? []}
            isLoading={teamsLoading}
            emptyMessage="No sales teams configured"
          />
        </section>
      ) : null}

      {activeTab === 'Territories' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Territories</h2>
            <Button
              size="sm"
              onClick={() =>
                void createTerritory.mutateAsync({ name: 'New Territory', code: `TERR-${Date.now()}`, assignedEmployeeIds: [] })
              }
              disabled={createTerritory.isPending}
            >
              Add Territory
            </Button>
          </div>
          <DataTable
            columns={[
              { key: 'code', header: 'Code' },
              { key: 'name', header: 'Name' },
              { key: 'region', header: 'Region', render: (row) => row.region ?? '—' },
              { key: 'assignedEmployeeIds', header: 'Assigned', render: (row) => row.assignedEmployeeIds?.length ?? 0 },
              { key: 'status', header: 'Status', render: (row) => <span className="capitalize">{row.status}</span> },
            ]}
            data={territories?.items ?? []}
            isLoading={territoriesLoading}
            emptyMessage="No territories configured"
          />
        </section>
      ) : null}

      {activeTab === 'Targets' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Sales Targets</h2>
            <Button
              size="sm"
              onClick={() => {
                void createTarget.mutateAsync({
                  periodStart: dates.startDate,
                  periodEnd: dates.endDate,
                  targetValue: 0,
                  currency: 'INR',
                });
              }}
              disabled={createTarget.isPending}
            >
              Add Target
            </Button>
          </div>
          <DataTable
            columns={[
              { key: 'periodStart', header: 'Period Start' },
              { key: 'periodEnd', header: 'Period End' },
              { key: 'targetValue', header: 'Target', render: (row) => `${row.currency} ${row.targetValue.toLocaleString()}` },
              { key: 'achievedValue', header: 'Achieved', render: (row) => row.achievedValue.toLocaleString() },
              {
                key: 'progress',
                header: 'Progress',
                render: (row) =>
                  row.targetValue > 0 ? `${Math.round((row.achievedValue / row.targetValue) * 100)}%` : '—',
              },
            ]}
            data={targets?.items ?? []}
            isLoading={targetsLoading}
            emptyMessage="No sales targets configured"
          />
        </section>
      ) : null}

      {activeTab === 'Policies' ? (
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h2 className="font-semibold">Sales Policy Settings</h2>
          </div>
          <SalesPolicyForm />
        </section>
      ) : null}

      {activeTab === 'Import/Export' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="font-semibold">Import & Export Leads</h2>
          <p className="text-sm text-muted-foreground">Import leads from CSV or export all leads for backup.</p>
          <div className="flex flex-wrap gap-3">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importLeads.mutateAsync(file);
            }} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importLeads.isPending}>
              <FileUp className="mr-2 h-4 w-4" />
              {importLeads.isPending ? 'Importing...' : 'Import CSV'}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const blob = await exportLeads.mutateAsync({});
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'leads-export.csv';
                link.click();
                URL.revokeObjectURL(url);
              }}
              disabled={exportLeads.isPending}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {exportLeads.isPending ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
          {importLeads.isSuccess ? (
            <p className="text-sm text-emerald-600">Imported {importLeads.data?.imported ?? 0} leads.</p>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'Analytics' ? (
        <section className="space-y-6">
          {conversion ? (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 font-semibold">Conversion Funnel</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={Layers} label="Total Leads" value={conversion.totalLeads} />
                <StatCard icon={Target} label="Won" value={conversion.wonCount} />
                <StatCard icon={TrendingUp} label="Lost" value={conversion.lostCount} />
              </div>
              <DataTable
                columns={[
                  { key: 'stageName', header: 'Stage' },
                  { key: 'count', header: 'Count' },
                  { key: 'conversionRate', header: 'Conversion %', render: (row) => `${row.conversionRate}%` },
                ]}
                data={(conversion.stages ?? []).map((s) => ({ ...s, id: s.stageId }))}
                emptyMessage="No conversion data"
              />
            </div>
          ) : null}
          {revenue ? (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 font-semibold">Revenue Analytics</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard icon={BarChart3} label="Total Revenue" value={revenue.totalRevenue.toLocaleString()} />
                <StatCard icon={TrendingUp} label="Avg Deal Size" value={revenue.averageDealSize.toLocaleString()} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
