import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import { ROUTES } from '@/config/app.config';

export const WIZARD_STORAGE_KEY = 'hr-shakya-company-setup-wizard';

export interface WizardStepDefinition {
  id: string;
  title: string;
  description: string;
  entityKey?: MasterEntityKey;
  kind: 'company' | 'entity' | 'review';
}

export const COMPANY_SETUP_STEPS: WizardStepDefinition[] = [
  { id: 'company', title: 'Company Details', description: 'Legal identity, contact, and fiscal settings.', kind: 'company' },
  { id: 'branch', title: 'Branch', description: 'Primary head office branch.', kind: 'entity', entityKey: 'branch' },
  { id: 'department', title: 'Departments', description: 'Core departments and hierarchy.', kind: 'entity', entityKey: 'department' },
  { id: 'designation', title: 'Designations', description: 'Job titles and levels.', kind: 'entity', entityKey: 'designation' },
  { id: 'job-role', title: 'Job Roles', description: 'Recruitment-ready role definitions.', kind: 'entity', entityKey: 'job-role' },
  { id: 'office-location', title: 'Office Locations', description: 'Physical and remote work locations.', kind: 'entity', entityKey: 'office-location' },
  { id: 'work-shift', title: 'Work Shifts', description: 'Shift schedules and grace rules.', kind: 'entity', entityKey: 'work-shift' },
  { id: 'holiday', title: 'Holiday Calendar', description: 'Company holidays for the year.', kind: 'entity', entityKey: 'holiday' },
  { id: 'review', title: 'Review & Finish', description: 'Confirm setup and launch administration.', kind: 'review' },
];

export interface WizardDraftState {
  currentStepIndex: number;
  company: Record<string, unknown>;
  entities: Partial<Record<MasterEntityKey, Record<string, unknown>[]>>;
  updatedAt: string;
}

export function loadWizardDraft(): WizardDraftState | null {
  try {
    const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as WizardDraftState;
  } catch {
    return null;
  }
}

export function saveWizardDraft(state: WizardDraftState): void {
  localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
}

export function clearWizardDraft(): void {
  localStorage.removeItem(WIZARD_STORAGE_KEY);
}

export function wizardStepIndex(stepId: string): number {
  return COMPANY_SETUP_STEPS.findIndex((step) => step.id === stepId);
}

export function buildWizardStepUrl(stepId: string): string {
  return `${ROUTES.ORGANIZATION_SETUP}?step=${stepId}`;
}

export function buildEntityCreateUrl(entityKey: MasterEntityKey): string {
  return `${ROUTES.organizationEntity(entityKey)}?action=create`;
}
