import { Activity, Database, HardDrive, Mail, Server } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useApprovalInbox } from '@/features/approval/hooks/use-approval';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { useSystemHealth } from '@/features/configuration/hooks/use-configuration';
import { APP_CONFIG } from '@/config/app.config';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { WidgetGrid } from '@/shared/components/widget-system/widget-frame';

async function fetchLegacyHealth() {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}/health`);
  return response.json() as Promise<{ status?: string; services?: Record<string, { status?: string }> }>;
}

function statusColor(status?: string): string {
  if (!status) return 'text-muted-foreground';
  const normalized = status.toLowerCase();
  if (normalized === 'ok' || normalized === 'healthy' || normalized === 'up') return 'text-green-600';
  if (normalized === 'degraded' || normalized === 'warn') return 'text-amber-600';
  return 'text-destructive';
}

export function SystemHealthPage() {
  const { data: employees } = useEmployees({ page: 1, pageSize: 1 });
  const { data: approvals } = useApprovalInbox({ page: 1, pageSize: 1, status: 'pending' });
  const { data: health, isLoading } = useSystemHealth();
  const { data: legacyHealth } = useQuery({
    queryKey: ['system', 'legacy-health'],
    queryFn: fetchLegacyHealth,
    staleTime: 30_000,
  });

  const mergedServices = {
    ...(legacyHealth?.services ?? {}),
    ...(health?.services ?? {}),
  };
  const overallStatus = health?.status ?? legacyHealth?.status ?? 'unknown';

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Infrastructure status, service dependencies, and operational signals."
      />
      {isLoading ? <Loading message="Loading system health..." /> : null}
      <WidgetGrid>
        <StatCard
          icon={Server}
          label="Overall Status"
          value={overallStatus}
          hint={health?.environment ?? 'production'}
        />
        <StatCard icon={Activity} label="Company Growth" value={employees?.pagination?.total ?? 0} hint="Total employees" />
        <StatCard label="Pending Approvals" value={approvals?.pagination?.total ?? 0} />
        {health?.uptime != null ? (
          <StatCard label="Uptime" value={`${Math.floor(health.uptime / 3600)}h`} hint="Process uptime" />
        ) : null}
        {health?.version ? <StatCard label="Version" value={health.version} /> : null}
      </WidgetGrid>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Services</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(mergedServices).map(([name, service]) => {
            const svc =
              typeof service === 'string'
                ? { status: service, latencyMs: undefined as number | undefined, message: undefined as string | undefined }
                : {
                    status: String((service as { status?: string }).status ?? 'unknown'),
                    latencyMs: (service as { latencyMs?: number }).latencyMs,
                    message: (service as { message?: string }).message,
                  };
            const Icon = name.includes('mongo') || name.includes('db') ? Database : name.includes('redis') ? Activity : HardDrive;
            return (
              <div key={name} className="flex items-start gap-3 rounded-md border p-3">
                <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium capitalize">{name.replace(/_/g, ' ')}</p>
                  <p className={`text-sm font-semibold ${statusColor(svc.status)}`}>{svc.status ?? 'unknown'}</p>
                  {'latencyMs' in svc && svc.latencyMs != null ? (
                    <p className="text-xs text-muted-foreground">{svc.latencyMs}ms latency</p>
                  ) : null}
                  {svc.message ? (
                    <p className="text-xs text-muted-foreground">{svc.message}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!Object.keys(mergedServices).length ? (
            <>
              <StatCard icon={Database} label="Database" value={legacyHealth?.services?.mongodb?.status ?? 'unknown'} />
              <StatCard icon={Activity} label="Redis" value={legacyHealth?.services?.redis?.status ?? 'n/a'} />
              <StatCard icon={HardDrive} label="Storage" value="Cloudinary" hint="Configured via settings" />
              <StatCard icon={Mail} label="Email Queue" value="SMTP" hint="Configure in settings" />
            </>
          ) : null}
        </div>
      </section>

      {health?.queues && Object.keys(health.queues).length > 0 ? (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job Queues</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(health.queues).map(([name, queue]) => (
              <div key={name} className="rounded-md border p-3 text-sm">
                <p className="font-medium capitalize">{name}</p>
                <p className="text-muted-foreground">Pending: {queue.pending}</p>
                <p className="text-muted-foreground">Failed: {queue.failed}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {health?.metrics && Object.keys(health.metrics).length > 0 ? (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Metrics</h2>
          <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(health.metrics).map(([key, value]) => (
              <div key={key} className="rounded-md bg-muted/40 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{key}</dt>
                <dd className="font-semibold">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
