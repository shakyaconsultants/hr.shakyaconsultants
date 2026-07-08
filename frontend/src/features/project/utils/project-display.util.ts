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
