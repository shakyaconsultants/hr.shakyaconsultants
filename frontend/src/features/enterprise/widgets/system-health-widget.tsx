import { useQuery } from '@tanstack/react-query';
import { APP_CONFIG } from '@/config/app.config';
import { StatCard } from '@/shared/components/stat-card';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

interface HealthResponse {
  status?: string;
  services?: {
    mongodb?: { status?: string };
    redis?: { status?: string };
  };
}

async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json() as Promise<HealthResponse>;
}

export function SystemHealthWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: fetchHealth,
    staleTime: 60_000,
  });

  if (isLoading) {
    return <WidgetSkeleton title="System Health" />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to reach system health endpoint.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatCard label="API" value={data?.status ?? 'unknown'} />
      <StatCard label="Database" value={data?.services?.mongodb?.status ?? 'unknown'} />
      <StatCard label="Queue" value={data?.services?.redis?.status ?? 'n/a'} />
      <StatCard label="Storage" value="Cloudinary" hint="Configured via environment" />
    </div>
  );
}
