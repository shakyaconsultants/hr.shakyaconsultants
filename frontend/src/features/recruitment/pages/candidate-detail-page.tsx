import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, UserCheck } from 'lucide-react';
import {
  useArchiveCandidate,
  useCandidate,
  useCandidateTimeline,
  useConvertCandidate,
  useInterviews,
  useOffers,
  useOnboarding,
  usePipelineStages,
  useRestoreCandidate,
  useTransitionPipeline,
  useUploadResume,
} from '@/features/recruitment/hooks/use-recruitment';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';

const TABS = ['Overview', 'Timeline', 'Interviews', 'Offers', 'Onboarding'] as const;

function formatStage(slug: string): string {
  return slug.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function CandidateDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [convertDept, setConvertDept] = useState('');
  const [convertDesignation, setConvertDesignation] = useState('');

  const { data: candidate, isLoading, isError } = useCandidate(id);
  const { data: timeline = [] } = useCandidateTimeline(id);
  const { data: interviews = [] } = useInterviews({ candidateLeadId: id });
  const { data: offers = [] } = useOffers(id);
  const { data: onboarding } = useOnboarding(id);
  const { data: stages = [] } = usePipelineStages();

  const archiveMutation = useArchiveCandidate();
  const restoreMutation = useRestoreCandidate();
  const transitionMutation = useTransitionPipeline();
  const convertMutation = useConvertCandidate();
  const uploadMutation = useUploadResume();

  if (isLoading) {
    return <Loading message="Loading candidate profile..." />;
  }

  if (isError || !candidate) {
    return <p className="text-destructive">Failed to load candidate profile.</p>;
  }

  async function handleResumeUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await uploadMutation.mutateAsync({ candidateId: id, file });
  }

  async function handleStageChange(stage: string) {
    await transitionMutation.mutateAsync({ candidateId: id, stage });
  }

  async function handleConvert() {
    if (!convertDept || !convertDesignation) {
      return;
    }
    await convertMutation.mutateAsync({
      candidateLeadId: id,
      departmentId: convertDept,
      designationId: convertDesignation,
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
          {candidate.firstName.charAt(0)}
          {candidate.lastName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">
            {candidate.firstName} {candidate.lastName}
          </h1>
          <p className="text-sm">{candidate.email}</p>
          {candidate.phone && <p className="text-sm text-muted-foreground">{candidate.phone}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {formatStage(candidate.pipelineStage)}
            </span>
            {candidate.isArchived && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs text-destructive">Archived</span>
            )}
            {candidate.employeeId && (
              <Link to={ROUTES.employeeDetail(candidate.employeeId)} className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs text-green-700 hover:underline">
                Employee
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {candidate.isArchived ? (
            <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate(id)} disabled={restoreMutation.isPending}>
              Restore
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate(id)} disabled={archiveMutation.isPending}>
              Archive
            </Button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            <Upload className="h-4 w-4" />
            Resume
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
          </label>
          {candidate.resumeUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={candidate.resumeUrl} target="_blank" rel="noreferrer">
                <FileText className="mr-1 h-4 w-4" />
                View Resume
              </a>
            </Button>
          )}
        </div>
      </div>

      {!candidate.employeeId && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-2 text-sm font-medium">Move to stage</p>
          <div className="flex flex-wrap gap-2">
            {stages.map((stage) => (
              <Button
                key={stage.id}
                variant={candidate.pipelineStage === stage.slug ? 'default' : 'outline'}
                size="sm"
                disabled={transitionMutation.isPending || candidate.pipelineStage === stage.slug}
                onClick={() => handleStageChange(stage.slug)}
              >
                {stage.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        {activeTab === 'Overview' && (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Stage</dt>
              <dd>{formatStage(candidate.pipelineStage)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Created</dt>
              <dd>{new Date(candidate.createdAt).toLocaleDateString()}</dd>
            </div>
            {candidate.convertedAt && (
              <div>
                <dt className="text-sm text-muted-foreground">Converted</dt>
                <dd>{new Date(candidate.convertedAt).toLocaleDateString()}</dd>
              </div>
            )}
            {candidate.tags && candidate.tags.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {candidate.tags.map((tag) => (
                    <span key={tag} className="rounded bg-muted px-2 py-0.5 text-xs">{tag}</span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}

        {activeTab === 'Timeline' && (
          <ul className="space-y-4">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timeline events yet.</p>
            ) : (
              timeline.map((event) => (
                <li key={event.id} className="relative border-l-2 border-primary/30 pl-4">
                  <p className="font-medium">{event.title}</p>
                  {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                </li>
              ))
            )}
          </ul>
        )}

        {activeTab === 'Interviews' && (
          <ul className="space-y-3">
            {interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No interviews scheduled.</p>
            ) : (
              interviews.map((interview) => (
                <li key={interview.id} className="rounded border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium capitalize">{interview.interviewType.replace(/_/g, ' ')} — Round {interview.round}</p>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">{interview.status}</span>
                  </div>
                  <p className="text-muted-foreground">{new Date(interview.scheduledAt).toLocaleString()}</p>
                  {interview.meetingLink && (
                    <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      Join meeting
                    </a>
                  )}
                  {interview.score !== undefined && <p className="mt-1">Score: {interview.score}</p>}
                  {interview.decision && <p>Decision: {interview.decision}</p>}
                </li>
              ))
            )}
          </ul>
        )}

        {activeTab === 'Offers' && (
          <ul className="space-y-3">
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No offers yet.</p>
            ) : (
              offers.map((offer) => (
                <li key={offer.id} className="rounded border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">Offer v{offer.version}</p>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{offer.status}</span>
                  </div>
                  {offer.joiningDate && <p>Joining: {new Date(offer.joiningDate).toLocaleDateString()}</p>}
                  {offer.documentUrl && (
                    <a href={offer.documentUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      Download offer letter
                    </a>
                  )}
                </li>
              ))
            )}
          </ul>
        )}

        {activeTab === 'Onboarding' && (
          <div className="space-y-4">
            {!onboarding ? (
              <p className="text-sm text-muted-foreground">Onboarding not started.</p>
            ) : (
              <>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{onboarding.progressPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${onboarding.progressPercent}%` }} />
                  </div>
                </div>
                {onboarding.currentSection && (
                  <p className="text-sm">Current section: <span className="font-medium capitalize">{onboarding.currentSection.replace(/_/g, ' ')}</span></p>
                )}
                <ul className="grid gap-2 sm:grid-cols-2">
                  {onboarding.completedSections.map((section) => (
                    <li key={section} className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm capitalize">
                      {section.replace(/_/g, ' ')} ✓
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!candidate.employeeId && candidate.pipelineStage === 'offer_accepted' && (
              <div className="mt-6 rounded border border-dashed p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <p className="font-medium">Convert to Employee</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Department ID" value={convertDept} onChange={(e) => setConvertDept(e.target.value)} />
                  <Input placeholder="Designation ID" value={convertDesignation} onChange={(e) => setConvertDesignation(e.target.value)} />
                </div>
                <Button className="mt-3" onClick={handleConvert} disabled={convertMutation.isPending || !convertDept || !convertDesignation}>
                  {convertMutation.isPending ? 'Converting...' : 'Convert to Employee'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
