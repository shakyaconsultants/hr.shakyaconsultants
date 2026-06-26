import { Activity, Database, HardDrive, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useApprovalInbox } from '@/features/approval/hooks/use-approval';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { APP_CONFIG } from '@/config/app.config';
import { PageHeader } from '@/shared/components/page-header';
import { StatCard } from '@/shared/components/stat-card';
import { WidgetGrid } from '@/shared/components/widget-system/widget-frame';

async function fetchHealth() {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}/health`);
  return response.json() as Promise<{ status?: string; services?: Record<string, { status?: string }> }>;
}

export function SystemDashboardPage() {
  const { data: employees } = useEmployees({ page: 1, pageSize: 1 });
  const { data: approvals } = useApprovalInbox({ page: 1, pageSize: 1, status: 'pending' });
  const { data: health } = useQuery({ queryKey: ['system', 'health'], queryFn: fetchHealth, staleTime: 30_000 });

  return (
    <div className="space-y-6">
      <PageHeader title="System Administration Dashboard" description="Infrastructure health, usage signals, and operational queue status." />
      <WidgetGrid>
        <StatCard icon={Activity} label="Company Growth" value={employees?.pagination?.total ?? 0} hint="Total employees" />
        <StatCard label="Pending Approvals" value={approvals?.pagination?.total ?? 0} />
        <StatCard icon={Database} label="Database" value={health?.services?.mongodb?.status ?? health?.status ?? 'unknown'} />
        <StatCard icon={Activity} label="Redis" value={health?.services?.redis?.status ?? 'n/a'} />
        <StatCard icon={HardDrive} label="Storage" value="Cloudinary" hint="Configured via settings" />
        <StatCard icon={Mail} label="Email Queue" value="SMTP" hint="Configure in settings" />
      </WidgetGrid>
      <section className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Recent errors, failed jobs, and audit summaries will appear here as observability modules are connected.
      </section>
    </div>
  );
}
