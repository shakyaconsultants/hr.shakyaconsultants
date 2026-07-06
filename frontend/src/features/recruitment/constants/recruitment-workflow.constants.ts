/** Simplified recruitment pipeline — single linear flow for HR. */
export const RECRUITMENT_WORKFLOW_STEPS = [
  { slug: 'lead', label: 'Lead', description: 'Applicant created manually' },
  {
    slug: 'interview_scheduled',
    label: 'Interview',
    description: 'Schedule interview with the candidate',
  },
  { slug: 'selected', label: 'Selected', description: 'Candidate passed the interview' },
  {
    slug: 'onboarding',
    label: 'Offer & Onboarding',
    description: 'Send offer letter and onboarding form',
  },
  { slug: 'employee_converted', label: 'Employee', description: 'Active employee account created' },
] as const;

export type WorkflowStepSlug = (typeof RECRUITMENT_WORKFLOW_STEPS)[number]['slug'] | 'rejected';

/** Map legacy / auto-transition stages to the simplified workflow step. */
export function normalizeWorkflowStage(stage?: string | null): WorkflowStepSlug {
  switch (stage) {
    case 'interview_scheduled':
    case 'interview_completed':
      return 'interview_scheduled';
    case 'selected':
      return 'selected';
    case 'rejected':
      return 'rejected';
    case 'offer_sent':
    case 'offer_accepted':
    case 'onboarding':
      return 'onboarding';
    case 'employee_converted':
      return 'employee_converted';
    case 'applied':
    case 'resume_screening':
    case 'shortlisted':
    case 'lead':
    default:
      return 'lead';
  }
}

export function getWorkflowStepIndex(stage?: string | null): number {
  const normalized = normalizeWorkflowStage(stage);
  if (normalized === 'rejected') {
    return -1;
  }
  return RECRUITMENT_WORKFLOW_STEPS.findIndex((step) => step.slug === normalized);
}

export function formatWorkflowStage(stage?: string | null): string {
  const normalized = normalizeWorkflowStage(stage);
  if (normalized === 'rejected') {
    return 'Rejected';
  }
  const step = RECRUITMENT_WORKFLOW_STEPS.find((item) => item.slug === normalized);
  return step?.label ?? 'Unknown';
}

export const WORKFLOW_STAGE_FILTER_OPTIONS = [
  { value: '', label: 'All stages' },
  ...RECRUITMENT_WORKFLOW_STEPS.map((step) => ({ value: step.slug, label: step.label })),
  { value: 'rejected', label: 'Rejected' },
];
