const PROJECT_ROLE_LABELS: Record<string, string> = {
  project_manager: 'Project Manager',
  assistant_project_manager: 'Assistant PM',
  developer: 'Developer',
  qa: 'QA',
  designer: 'Designer',
  devops: 'DevOps',
  business_analyst: 'Business Analyst',
  intern: 'Intern',
  owner: 'Owner',
  viewer: 'Viewer',
  member: 'Member',
};

export function formatProjectStatus(slug: string): string {
  if (!slug) return '';
  const TASK_STATUS_LABELS: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'To Do',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    waiting_verification: 'Waiting Verification',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  };
  if (TASK_STATUS_LABELS[slug]) {
    return TASK_STATUS_LABELS[slug];
  }
  return slug
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatProjectRole(role?: string | null): string {
  if (!role) return 'Member';
  return (
    PROJECT_ROLE_LABELS[role] ??
    role
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

export function canSubmitTaskForVerification(status: string): boolean {
  return ['todo', 'assigned', 'in_progress', 'backlog', 'blocked', 'rejected'].includes(status);
}
