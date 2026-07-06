import { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import type {
  CandidateRecord,
  InterviewRecord,
  OfferRecord,
  OnboardingRecord,
} from '@/features/recruitment/api/recruitment.api';
import { ConvertCandidatePanel } from '@/features/recruitment/components/convert-candidate-panel';
import { ScheduleInterviewPanel } from '@/features/recruitment/components/schedule-interview-panel';
import { SendOfferOnboardingPanel } from '@/features/recruitment/components/send-offer-onboarding-panel';
import {
  RECRUITMENT_WORKFLOW_STEPS,
  getWorkflowStepIndex,
  normalizeWorkflowStage,
} from '@/features/recruitment/constants/recruitment-workflow.constants';
import { useTransitionPipeline } from '@/features/recruitment/hooks/use-recruitment';
import {
  formatInterviewType,
  safeLocaleDateTime,
} from '@/features/recruitment/utils/recruitment-display.util';
import { Dialog } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';
import { runActionMutation } from '@/shared/feedback/run-form-mutation';

export interface RecruitmentPipelineStepperProps {
  candidate: CandidateRecord;
  interviews: InterviewRecord[];
  offers: OfferRecord[];
  onboarding: OnboardingRecord | null | undefined;
}

export function RecruitmentPipelineStepper({
  candidate,
  interviews,
  offers,
  onboarding,
}: RecruitmentPipelineStepperProps) {
  const transitionMutation = useTransitionPipeline();
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const normalizedStage = normalizeWorkflowStage(candidate.pipelineStage);
  const currentStepIndex = getWorkflowStepIndex(candidate.pipelineStage);
  const isRejected = normalizedStage === 'rejected';
  const isEmployee = Boolean(candidate.employeeId) || normalizedStage === 'employee_converted';
  const nextInterviewRound =
    interviews.length > 0 ? Math.max(...interviews.map((item) => item.round ?? 1)) + 1 : 1;
  const sentOffer = offers.some((offer) => offer.status === 'sent');

  async function markSelected() {
    await runActionMutation({
      successMessage: 'Candidate marked as selected',
      mutation: () =>
        transitionMutation.mutateAsync({ candidateId: candidate.id, stage: 'selected' }),
    });
  }

  async function markRejected() {
    await runActionMutation({
      successMessage: 'Candidate rejected — notification sent',
      mutation: () =>
        transitionMutation.mutateAsync({
          candidateId: candidate.id,
          stage: 'rejected',
          reason: rejectReason || undefined,
        }),
    });
  }

  function handleStepClick(stepSlug: string, stepIndex: number) {
    if (isRejected || isEmployee) {
      return;
    }
    if (stepIndex > currentStepIndex + 1) {
      return;
    }

    if (stepSlug === 'interview_scheduled') {
      setInterviewDialogOpen(true);
      return;
    }
    if (stepSlug === 'onboarding' && normalizedStage === 'selected') {
      setOfferDialogOpen(true);
    }
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Recruitment Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Follow these steps in order. Click a step to open the action for that stage.
          </p>
        </div>

        {isRejected ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">Candidate rejected</p>
            <p className="text-muted-foreground">This application is closed.</p>
          </div>
        ) : null}

        <ol className="space-y-3">
          {RECRUITMENT_WORKFLOW_STEPS.map((step, index) => {
            const isComplete = isEmployee ? true : currentStepIndex > index;
            const isCurrent = !isEmployee && !isRejected && currentStepIndex === index;
            const isClickable =
              !isRejected &&
              !isEmployee &&
              (step.slug === 'interview_scheduled'
                ? index <= currentStepIndex + 1
                : step.slug === 'onboarding' &&
                  (normalizedStage === 'selected' || normalizedStage === 'onboarding'));

            return (
              <li key={step.slug}>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => handleStepClick(step.slug, index)}
                  className={cn(
                    'flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors',
                    isCurrent && 'border-primary bg-primary/5',
                    isComplete && 'border-green-200 bg-green-50/50',
                    isClickable && 'hover:bg-muted/50',
                    !isClickable && 'cursor-default opacity-80',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                      isComplete
                        ? 'bg-green-600 text-white'
                        : isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{step.label}</p>
                      {isCurrent ? (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>

                    {isCurrent && step.slug === 'lead' ? (
                      <Button
                        className="mt-3"
                        size="sm"
                        type="button"
                        onClick={() => setInterviewDialogOpen(true)}
                      >
                        Schedule Interview
                      </Button>
                    ) : null}

                    {isCurrent && step.slug === 'lead' ? (
                      <p className="mt-2 text-sm">
                        Applicant record created. Schedule an interview to continue.
                      </p>
                    ) : null}

                    {step.slug === 'interview_scheduled' && interviews.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {interviews.map((interview) => (
                          <li key={interview.id}>
                            Round {interview.round ?? 1}:{' '}
                            {formatInterviewType(interview.interviewType)} —{' '}
                            {safeLocaleDateTime(interview.scheduledAt)}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {isCurrent && step.slug === 'interview_scheduled' ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => setInterviewDialogOpen(true)}
                        >
                          Schedule Interview
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => void markSelected()}
                        >
                          Mark Selected
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => void markRejected()}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}

                    {isCurrent && step.slug === 'interview_scheduled' ? (
                      <Input
                        className="mt-2"
                        placeholder="Rejection reason (optional)"
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    ) : null}

                    {isCurrent && step.slug === 'selected' ? (
                      <Button
                        className="mt-3"
                        size="sm"
                        type="button"
                        onClick={() => setOfferDialogOpen(true)}
                      >
                        Send Offer & Onboarding Form
                      </Button>
                    ) : null}

                    {step.slug === 'onboarding' && onboarding ? (
                      <p className="mt-2 text-sm">
                        Onboarding progress: {onboarding.progressPercent ?? 0}% (employee completes
                        once in portal)
                      </p>
                    ) : null}
                  </div>
                  {isClickable ? (
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>

        {!isRejected && !isEmployee && sentOffer ? (
          <div className="mt-6 border-t pt-6">
            <ConvertCandidatePanel
              candidateId={candidate.id}
              defaultDepartmentId={candidate.departmentId}
              defaultDesignationId={candidate.designationId}
              hasSentOffer={sentOffer}
            />
          </div>
        ) : null}

        {isEmployee ? (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Employee account is active with default login credentials. Onboarding is completed once
            from the employee portal.
          </div>
        ) : null}
      </div>

      <Dialog
        open={interviewDialogOpen}
        onOpenChange={setInterviewDialogOpen}
        title="Schedule Interview"
        description="Set date, time, and meeting details. The candidate receives an interview invite email."
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setInterviewDialogOpen(false)}>
            Close
          </Button>
        }
      >
        <ScheduleInterviewPanel
          candidateId={candidate.id}
          defaultDesignationId={candidate.designationId}
          nextRound={nextInterviewRound}
          onScheduled={() => setInterviewDialogOpen(false)}
        />
      </Dialog>

      <Dialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        title="Offer & Onboarding"
        description="Send the offer letter and onboarding portal link together."
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>
            Close
          </Button>
        }
      >
        <SendOfferOnboardingPanel
          candidateId={candidate.id}
          defaultDepartmentId={candidate.departmentId}
          defaultDesignationId={candidate.designationId}
          offers={offers}
          onSent={() => setOfferDialogOpen(false)}
        />
      </Dialog>
    </>
  );
}
