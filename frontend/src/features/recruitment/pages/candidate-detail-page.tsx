import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Upload } from 'lucide-react';
import { RecruitmentPipelineStepper } from '@/features/recruitment/components/recruitment-pipeline-stepper';
import {
  useArchiveCandidate,
  useCandidate,
  useCandidateTimeline,
  useRestoreCandidate,
  useUploadResume,
  useInterviews,
  useOffers,
  useOnboarding,
} from '@/features/recruitment/hooks/use-recruitment';
import {
  formatWorkflowStage,
  normalizeWorkflowStage,
} from '@/features/recruitment/constants/recruitment-workflow.constants';
import {
  getCandidateDisplayName,
  getCandidateInitials,
  safeLocaleDate,
  safeLocaleDateTime,
} from '@/features/recruitment/utils/recruitment-display.util';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { runActionMutation } from '@/shared/feedback/run-form-mutation';
import { ROUTES } from '@/config/app.config';

export function CandidateDetailPage() {
  const { id = '' } = useParams();

  const { data: candidate, isLoading, isError } = useCandidate(id);
  const { data: timeline = [] } = useCandidateTimeline(id);
  const { data: interviews = [] } = useInterviews({ candidateLeadId: id });
  const { data: offers = [] } = useOffers(id);
  const { data: onboarding } = useOnboarding(id);

  const archiveMutation = useArchiveCandidate();
  const restoreMutation = useRestoreCandidate();
  const uploadMutation = useUploadResume();

  if (isLoading) {
    return <Loading message="Loading candidate profile..." />;
  }

  if (isError || !candidate) {
    return <p className="text-destructive">Failed to load candidate profile.</p>;
  }

  const displayName = getCandidateDisplayName(candidate);
  const initials = getCandidateInitials(candidate);
  const workflowStage = formatWorkflowStage(candidate.pipelineStage);
  const isRejected = normalizeWorkflowStage(candidate.pipelineStage) === 'rejected';

  async function handleResumeUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await runActionMutation({
      successMessage: 'Resume uploaded',
      mutation: () => uploadMutation.mutateAsync({ candidateId: id, file }),
    });
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.RECRUITMENT_CANDIDATES}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Candidates
      </Link>

      <div className="flex flex-wrap items-start gap-6 rounded-lg border bg-card p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-sm">{candidate.email || '—'}</p>
          {candidate.phone ? (
            <p className="text-sm text-muted-foreground">{candidate.phone}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={
                isRejected
                  ? 'rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive'
                  : 'rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
              }
            >
              {workflowStage}
            </span>
            {candidate.isArchived ? (
              <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs text-destructive">
                Archived
              </span>
            ) : null}
            {candidate.employeeId ? (
              <Link
                to={ROUTES.employeeDetail(candidate.employeeId)}
                className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs text-green-700 hover:underline"
              >
                Employee
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {candidate.isArchived ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => restoreMutation.mutate(id)}
              disabled={restoreMutation.isPending}
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => archiveMutation.mutate(id)}
              disabled={archiveMutation.isPending}
            >
              Archive
            </Button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            <Upload className="h-4 w-4" />
            Resume
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleResumeUpload}
            />
          </label>
          {candidate.resumeUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={candidate.resumeUrl} target="_blank" rel="noreferrer">
                <FileText className="mr-1 h-4 w-4" />
                View Resume
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <RecruitmentPipelineStepper
        candidate={candidate}
        interviews={interviews}
        offers={offers}
        onboarding={onboarding}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Applicant Details</h2>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{safeLocaleDate(candidate.createdAt)}</dd>
            </div>
            {candidate.convertedAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Converted</dt>
                <dd>{safeLocaleDate(candidate.convertedAt)}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Activity Timeline</h2>
          <ul className="max-h-64 space-y-3 overflow-y-auto">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              timeline.map((event) => (
                <li key={event.id} className="border-l-2 border-primary/30 pl-3 text-sm">
                  <p className="font-medium">{event.title ?? 'Update'}</p>
                  {event.description ? (
                    <p className="text-muted-foreground">{event.description}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {safeLocaleDateTime(event.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
