import { Link } from 'react-router-dom';
import { ArrowRight, Network, Users } from 'lucide-react';
import { useOrgChart } from '@/features/workspace/hooks/use-workspace';
import { ROUTES } from '@/config/app.config';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';

export function WorkspaceOrgPositionCard() {
  const { data: hierarchy, isLoading } = useOrgChart();

  return (
    <section className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm md:col-span-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">My Organization Position</h2>
            <p className="text-xs text-muted-foreground">Reporting line and team context</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.WORKSPACE_HIERARCHY}>
            View hierarchy
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Loading message="Loading position..." />
      ) : hierarchy ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat label="Reports to" value={hierarchy.managers.length} />
          <MiniStat label="Peers" value={hierarchy.peers.length} />
          <MiniStat label="Direct reports" value={hierarchy.directReports.length} />
          <div className="sm:col-span-3 rounded-lg border bg-card px-4 py-3 text-sm">
            <p className="font-medium">
              {hierarchy.self.firstName} {hierarchy.self.lastName}
            </p>
            <p className="text-muted-foreground">{hierarchy.self.email}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Reporting structure not configured yet.</p>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
