import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { useInterviews } from '@/features/recruitment/hooks/use-recruitment';
import { RecruitmentNav } from '@/features/recruitment/components/recruitment-nav';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function InterviewsCalendarPage() {
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = addDays(weekStart, 7);
  const { data: interviews = [], isLoading, isError } = useInterviews({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  });

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  if (isLoading) {
    return <Loading message="Loading interview calendar..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <CalendarDays className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Interview Calendar</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Week of {weekStart.toLocaleDateString()} — {addDays(weekStart, 6).toLocaleDateString()}
        </p>
      </div>

      <RecruitmentNav />

      {isError && <p className="text-destructive">Failed to load interviews.</p>}

      <div className="grid gap-3 md:grid-cols-7">
        {weekDays.map((day) => {
          const dayInterviews = interviews.filter((interview) => sameDay(new Date(interview.scheduledAt), day));
          return (
            <div key={day.toISOString()} className="min-h-[160px] rounded-lg border bg-card">
              <div className="border-b px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </p>
                <p className="text-lg font-semibold">{day.getDate()}</p>
              </div>
              <div className="space-y-2 p-2">
                {dayInterviews.length === 0 ? (
                  <p className="px-1 py-2 text-center text-[10px] text-muted-foreground">—</p>
                ) : (
                  dayInterviews.map((interview) => (
                    <Link
                      key={interview.id}
                      to={ROUTES.recruitmentCandidateDetail(interview.candidateLeadId)}
                      className="block rounded border bg-muted/40 px-2 py-1.5 text-xs hover:bg-muted"
                    >
                      <p className="font-medium capitalize">{interview.interviewType.replace(/_/g, ' ')}</p>
                      <p className="text-muted-foreground">
                        {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-muted-foreground">Round {interview.round}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
