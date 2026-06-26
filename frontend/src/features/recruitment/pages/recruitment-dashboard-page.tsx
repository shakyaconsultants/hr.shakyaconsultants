import { Link } from 'react-router-dom';
import { Briefcase, Calendar, FileText, TrendingUp, UserPlus } from 'lucide-react';
import { useRecruitmentDashboard } from '@/features/recruitment/hooks/use-recruitment';
import { RecruitmentNav } from '@/features/recruitment/components/recruitment-nav';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

function formatStageLabel(slug: string): string {
  return slug
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function RecruitmentDashboardPage() {
  const { data, isLoading, isError } = useRecruitmentDashboard();

  if (isLoading) {
    return <Loading message="Loading recruitment dashboard..." />;
  }

  if (isError || !data) {
    return <p className="text-destructive">Failed to load recruitment dashboard.</p>;
  }

  const pipelineEntries = Object.entries(data.pipelineOverview ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Briefcase className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Recruitment</h1>
          </div>
          <p className="text-sm text-muted-foreground">Pipeline overview, interviews, offers, and conversion metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={ROUTES.RECRUITMENT_PIPELINE}>View Pipeline</Link>
          </Button>
          <Button asChild>
            <Link to={`${ROUTES.RECRUITMENT_CANDIDATES}?action=create`}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Candidate
            </Link>
          </Button>
        </div>
      </div>

      <RecruitmentNav />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Today's Interviews" value={(data.todaysInterviews ?? []).length} />
        <StatCard icon={Calendar} label="Upcoming (7 days)" value={(data.upcomingInterviews ?? []).length} />
        <StatCard icon={FileText} label="Offers Pending" value={(data.offersPending ?? []).length} />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${data.conversionRate ?? 0}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Pipeline Overview</h2>
          <div className="space-y-2">
            {pipelineEntries.map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{formatStageLabel(stage)}</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">{count}</span>
              </div>
            ))}
            {pipelineEntries.length === 0 && <p className="text-sm text-muted-foreground">No candidates in pipeline.</p>}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Today's Interviews</h2>
          {(data.todaysInterviews ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No interviews scheduled for today.</p>
          ) : (
            <ul className="space-y-3">
              {(data.todaysInterviews ?? []).map((interview) => (
                <li key={interview.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium capitalize">{interview.interviewType.replace(/_/g, ' ')}</p>
                    <p className="text-muted-foreground">Round {interview.round}</p>
                  </div>
                  <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Offers Pending</h2>
          {(data.offersPending ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending offers.</p>
          ) : (
            <ul className="space-y-2">
              {(data.offersPending ?? []).slice(0, 5).map((offer) => (
                <li key={offer.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>Offer v{offer.version}</span>
                  <Link to={ROUTES.recruitmentCandidateDetail(offer.candidateLeadId)} className="text-primary hover:underline">
                    View candidate
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          {(data.recentActivity ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {(data.recentActivity ?? []).slice(0, 8).map((activity) => (
                <li key={activity.id} className="border-b pb-2 text-sm last:border-0">
                  <p>{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
