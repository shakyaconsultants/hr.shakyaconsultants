import { Activity, AlertTriangle, HardDrive, Mail, Plug, Upload, Webhook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { StatusBadge } from '@/features/integration/components/status-badge';
import { useIntegrationDashboard } from '@/features/integration/hooks/use-integration';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { StatCard } from '@/shared/components/stat-card';
import { WidgetGrid } from '@/shared/components/widget-system/widget-frame';

export function IntegrationDashboardPage() {
  const { data: dashboard, isLoading, isError } = useIntegrationDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Plug className="h-6 w-6 text-primary" />}
        title="Integration Dashboard"
        description="Super Admin overview of connected services, webhooks, API usage, and platform integration health."
      />

      {isLoading ? <Loading message="Loading integration dashboard..." /> : null}
      {isError ? (
        <p className="text-sm text-muted-foreground">
          Integration API unavailable — metrics will appear when the backend is connected.
        </p>
      ) : null}

      {dashboard ? (
        <>
          <WidgetGrid>
            <StatCard icon={Plug} label="Connected Services" value={dashboard.connectedServices} />
            <StatCard
              icon={AlertTriangle}
              label="Failed Integrations"
              value={dashboard.failedIntegrations}
              hint="Requires attention"
            />
            <StatCard icon={Webhook} label="Webhook Activity (24h)" value={dashboard.webhookActivity24h} />
            <StatCard icon={Activity} label="API Usage (24h)" value={dashboard.apiUsage24h} />
            <StatCard icon={Upload} label="Imports Today" value={dashboard.importJobsToday} />
            <StatCard icon={Upload} label="Exports Today" value={dashboard.exportJobsToday} />
            <StatCard label="Active Scheduler Jobs" value={dashboard.schedulerActiveJobs} />
            <StatCard label="Scheduler Failures" value={dashboard.schedulerFailedJobs} />
            <StatCard
              icon={HardDrive}
              label="Storage Used"
              value={`${dashboard.storageUsedMb} MB`}
              hint={`Quota: ${dashboard.storageQuotaMb} MB`}
            />
            <StatCard
              icon={Mail}
              label="Email Queue"
              value={dashboard.emailQueuePending}
              hint={`${dashboard.emailQueueFailed} failed`}
            />
          </WidgetGrid>

          <section className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recent Failures
              </h2>
              <Link to={ROUTES.INTEGRATION_LOGS} className="text-sm text-primary hover:underline">
                View all logs
              </Link>
            </div>
            {dashboard.recentFailures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent integration failures.</p>
            ) : (
              <ul className="divide-y">
                {dashboard.recentFailures.map((failure) => (
                  <li key={failure.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{failure.source}</p>
                      <p className="text-muted-foreground">{failure.message}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status="error" />
                      <time className="mt-1 block text-xs text-muted-foreground">
                        {new Date(failure.occurredAt).toLocaleString()}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Connectors', path: ROUTES.INTEGRATION_CONNECTORS },
              { label: 'API Keys', path: ROUTES.API_KEYS },
              { label: 'Webhooks', path: ROUTES.WEBHOOKS },
              { label: 'Import Center', path: ROUTES.IMPORT_CENTER },
              { label: 'Export Center', path: ROUTES.EXPORT_CENTER },
              { label: 'Scheduler', path: ROUTES.SCHEDULER },
              { label: 'Integration Logs', path: ROUTES.INTEGRATION_LOGS },
              { label: 'Backups', path: ROUTES.BACKUPS },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="rounded-lg border bg-card px-4 py-3 text-sm font-medium hover:bg-muted/30"
              >
                {link.label}
              </Link>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
