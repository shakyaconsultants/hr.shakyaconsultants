import { ROUTES } from '@/config/app.config';

export const PROJECT_WIZARD_STORAGE_KEY = 'hr-shakya-project-wizard';

export interface ProjectWizardStepDefinition {
  id: string;
  title: string;
  description: string;
}

export const PROJECT_WIZARD_STEPS: ProjectWizardStepDefinition[] = [
  { id: 'basic', title: 'Basic Information', description: 'Name, code, client, dates, org links, budget, visibility.' },
  { id: 'repository', title: 'Repository', description: 'Git repository, branches, and deployment URLs.' },
  { id: 'environment', title: 'Environment Configuration', description: 'Encrypted environment variables and deployment notes.' },
  { id: 'technology', title: 'Technology Stack', description: 'Technologies and tags for the project.' },
  { id: 'documents', title: 'Documents', description: 'Reference document URLs for the knowledge base.' },
  { id: 'modules', title: 'Modules', description: 'Initial project modules and structure.' },
  { id: 'milestones', title: 'Milestones', description: 'Key delivery milestones.' },
  { id: 'sprint', title: 'Initial Sprint', description: 'First sprint plan.' },
  { id: 'manager', title: 'Assign Project Manager', description: 'Primary and assistant project managers.' },
  { id: 'team', title: 'Assign Initial Team', description: 'Developers, QA, designers, and other roles.' },
  { id: 'review', title: 'Review', description: 'Confirm configuration before creating the project.' },
];

export interface WizardTeamMember {
  employeeId: string;
  role: string;
  allocationPercent?: number;
}

export interface WizardModule {
  name: string;
  description?: string;
}

export interface WizardMilestone {
  name: string;
  description?: string;
  dueDate: string;
}

export interface WizardSprint {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
}

export interface ProjectWizardDraft {
  currentStepIndex: number;
  basicInfo: {
    name: string;
    code: string;
    description: string;
    status: string;
    priority: string;
    categoryId: string;
    branchId: string;
    departmentId: string;
    startDate: string;
    targetDate: string;
    projectManagerId: string;
    clientName: string;
    budget: string;
    currency: string;
    riskLevel: string;
    visibility: string;
    tags: string;
  };
  repository: {
    repositoryUrl: string;
    defaultBranch: string;
    productionUrl: string;
    stagingUrl: string;
    apiUrl: string;
    swaggerUrl: string;
    documentationUrl: string;
    deploymentUrl: string;
    apiDocsUrl: string;
  };
  environment: {
    envVariables: string;
    credentials: string;
    deploymentGuide: string;
    architectureNotes: string;
  };
  technologyIds: string[];
  documentUrls: string;
  modules: WizardModule[];
  milestones: WizardMilestone[];
  sprint: WizardSprint;
  assistantManagerIds: string[];
  teamMembers: WizardTeamMember[];
  labels: string;
  taskCategories: string;
  updatedAt: string;
}

export const EMPTY_PROJECT_WIZARD_DRAFT: ProjectWizardDraft = {
  currentStepIndex: 0,
  basicInfo: {
    name: '',
    code: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    categoryId: '',
    branchId: '',
    departmentId: '',
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: '',
    projectManagerId: '',
    clientName: '',
    budget: '',
    currency: 'INR',
    riskLevel: 'low',
    visibility: 'internal',
    tags: '',
  },
  repository: {
    repositoryUrl: '',
    defaultBranch: 'main',
    productionUrl: '',
    stagingUrl: '',
    apiUrl: '',
    swaggerUrl: '',
    documentationUrl: '',
    deploymentUrl: '',
    apiDocsUrl: '',
  },
  environment: {
    envVariables: '',
    credentials: '',
    deploymentGuide: '',
    architectureNotes: '',
  },
  technologyIds: [],
  documentUrls: '',
  modules: [],
  milestones: [],
  sprint: {
    name: 'Sprint 1',
    goal: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  },
  assistantManagerIds: [],
  teamMembers: [],
  labels: '',
  taskCategories: '',
  updatedAt: new Date().toISOString(),
};

export function loadLocalWizardDraft(): ProjectWizardDraft | null {
  try {
    const raw = localStorage.getItem(PROJECT_WIZARD_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectWizardDraft;
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
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'assistant_project_manager', label: 'Assistant Project Manager' },
  { value: 'developer', label: 'Developer' },
  { value: 'qa', label: 'QA' },
  { value: 'designer', label: 'Designer' },
  { value: 'devops', label: 'DevOps' },
  { value: 'business_analyst', label: 'Business Analyst' },
  { value: 'intern', label: 'Intern' },
] as const;
