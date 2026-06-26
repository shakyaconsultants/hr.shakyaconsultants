import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/config/app.config';
import { Button } from '@/shared/components/ui/button';
import apiClient from '@/shared/api/axios.client';
import { Loading } from '@/shared/components/loading';
import type { ApiSuccessResponse } from '@/shared/types/api.types';

interface HealthData {
  mongodb: string;
  redis: string;
  queue: string;
}

async function fetchHealth(): Promise<HealthData> {
  const { data } = await apiClient.get<ApiSuccessResponse<HealthData>>('/health');
  return data.data;
}

export function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  if (isLoading) {
    return <Loading message="Connecting to API..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground">
          HR Shakya ERP — Organization, RBAC, Employees, and Recruitment modules are available.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to={ROUTES.ORGANIZATION}>Open Organization Module</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.RBAC}>Open Access Control</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.EMPLOYEES}>Open Employees</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.RECRUITMENT}>Open Recruitment</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.PROJECTS}>Open Projects</Link>
        </Button>
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">API Health</h2>
        {isError ? (
          <p className="text-destructive">Unable to reach backend API.</p>
        ) : (
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">MongoDB</dt>
              <dd className="font-medium">{data?.mongodb}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Redis</dt>
              <dd className="font-medium">{data?.redis}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Queue</dt>
              <dd className="font-medium">{data?.queue}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
