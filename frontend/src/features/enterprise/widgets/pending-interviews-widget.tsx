import { Link } from 'react-router-dom';
import { useRecruitmentDashboard } from '@/features/recruitment/hooks/use-recruitment';
import { ROUTES } from '@/config/app.config';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function PendingInterviewsWidget() {
  const { data, isLoading, isError } = useRecruitmentDashboard();

  if (isLoading) {
    return <WidgetSkeleton title="Pending Interviews" />;
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Unable to load interviews.</p>;
  }

  const upcoming = [...data.todaysInterviews, ...data.upcomingInterviews];

  return (
    <div className="space-y-3">
      <p className="text-3xl font-bold">{upcoming.length}</p>
      <p className="text-sm text-muted-foreground">Scheduled interviews</p>
      {upcoming.slice(0, 3).map((interview) => (
        <div key={interview.id} className="text-sm">
          {interview.interviewType} — {new Date(interview.scheduledAt).toLocaleString()}
        </div>
      ))}
      <Link to={ROUTES.RECRUITMENT_INTERVIEWS} className="text-sm font-medium text-primary hover:underline">
        View interview calendar
      </Link>
    </div>
  );
}
