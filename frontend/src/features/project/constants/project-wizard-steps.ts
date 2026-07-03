import { ROUTES } from '@/config/app.config';

export const PROJECT_WIZARD_STORAGE_KEY = 'hr-shakya-project-wizard';

export interface ProjectWizardStepDefinition {
  id: string;
  title: string;
  description: string;
}

export const PROJECT_WIZARD_STEPS: ProjectWizardStepDefinition[] = [
  { id: 'basic', title: 'Project Basics', description: 'Name, type, status, manager, and optional timeline.' },
  { id: 'requirements', title: 'Requirements & Docs', description: 'Goals, functionality, UI docs, and reference links.' },
  { id: 'tech', title: 'Technology & Scalability', description: 'Tech stack and scalability notes.' },
  { id: 'deployment', title: 'Repository & Deployment', description: 'GitHub, deployment URL, and encrypted environment variables.' },
  { id: 'team', title: 'Initial Team', description: 'Optional team members to add on day one.' },
  { id: 'review', title: 'Review', description: 'Confirm configuration before creating the project.' },
];

export interface WizardTeamMember {
  employeeId: string;
  role: string;
  allocationPercent?: number;
}

export interface ProjectWizardDraft {
  currentStepIndex: number;
  basicInfo: {
    name: string;
    code: string;
    description: string;
    projectKind: 'internal' | 'external';
    status: string;
    projectManagerId: string;
    clientName: string;
    startDate: string;
    endDate: string;
  };
  requirements: {
    goals: string;
    functionality: string;
    uiDocs: string;
    documentUrls: string;
  };
  tech: {
    technologyIds: string[];
    scalabilityNotes: string;
    tags: string;
  };
  deployment: {
    repositoryUrl: string;
    deploymentUrl: string;
    envVariables: string;
    deploymentGuide: string;
  };
  teamMembers: WizardTeamMember[];
  updatedAt: string;
}

export const EMPTY_PROJECT_WIZARD_DRAFT: ProjectWizardDraft = {
  currentStepIndex: 0,
  basicInfo: {
    name: '',
    code: '',
    description: '',
    projectKind: 'internal',
    status: 'planning',
    projectManagerId: '',
    clientName: '',
    startDate: '',
    endDate: '',
  },
  requirements: {
    goals: '',
    functionality: '',
    uiDocs: '',
    documentUrls: '',
  },
  tech: {
    technologyIds: [],
    scalabilityNotes: '',
    tags: '',
  },
  deployment: {
    repositoryUrl: '',
    deploymentUrl: '',
    envVariables: '',
    deploymentGuide: '',
  },
  teamMembers: [],
  updatedAt: new Date().toISOString(),
};

export function loadLocalWizardDraft(): ProjectWizardDraft | null {
  try {
    const raw = localStorage.getItem(PROJECT_WIZARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProjectWizardDraft>;
    return { ...EMPTY_PROJECT_WIZARD_DRAFT, ...parsed, basicInfo: { ...EMPTY_PROJECT_WIZARD_DRAFT.basicInfo, ...parsed.basicInfo } };
  } catch {
    return null;
  }
}

export function saveLocalWizardDraft(state: ProjectWizardDraft): void {
  localStorage.setItem(PROJECT_WIZARD_STORAGE_KEY, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
}

export function clearLocalWizardDraft(): void {
  localStorage.removeItem(PROJECT_WIZARD_STORAGE_KEY);
}

export function buildProjectWizardUrl(stepId?: string): string {
  return stepId ? `${ROUTES.PROJECTS_CREATE}?step=${stepId}` : ROUTES.PROJECTS_CREATE;
}

export function wizardStepIndex(stepId: string): number {
  return PROJECT_WIZARD_STEPS.findIndex((step) => step.id === stepId);
}

export const MEMBER_ROLE_OPTIONS = [
  { value: 'developer', label: 'Developer' },
  { value: 'qa', label: 'QA' },
  { value: 'designer', label: 'Designer' },
  { value: 'devops', label: 'DevOps' },
  { value: 'business_analyst', label: 'Business Analyst' },
  { value: 'intern', label: 'Intern' },
] as const;

export const PROJECT_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_hold', label: 'On Hold' },
] as const;

export const PROJECT_KIND_OPTIONS = [
  { value: 'internal', label: 'Internal (In-house)' },
  { value: 'external', label: 'External (Client)' },
] as const;
