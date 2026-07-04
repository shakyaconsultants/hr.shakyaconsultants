import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Save } from 'lucide-react';
import {
  EMPTY_PROJECT_WIZARD_DRAFT,
  MEMBER_ROLE_OPTIONS,
  PROJECT_KIND_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  PROJECT_WIZARD_STEPS,
  clearLocalWizardDraft,
  loadLocalWizardDraft,
  saveLocalWizardDraft,
  wizardStepIndex,
  type ProjectWizardDraft,
  type WizardTeamMember,
} from '@/features/project/constants/project-wizard-steps';
import {
  useFinalizeProjectWizard,
  useProjectWizardDraft,
  useSaveProjectWizardDraft,
} from '@/features/project/hooks/use-projects';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { DatePicker } from '@/shared/components/date-picker';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { cn } from '@/shared/utils/cn';

function mergeDraft(local: ProjectWizardDraft, remote: Record<string, unknown> | undefined): ProjectWizardDraft {
  if (!remote || Object.keys(remote).length === 0) return local;
  return {
    ...local,
    ...remote,
    basicInfo: { ...local.basicInfo, ...(remote.basicInfo as ProjectWizardDraft['basicInfo'] | undefined) },
    requirements: { ...local.requirements, ...(remote.requirements as ProjectWizardDraft['requirements'] | undefined) },
    tech: { ...local.tech, ...(remote.tech as ProjectWizardDraft['tech'] | undefined) },
    deployment: { ...local.deployment, ...(remote.deployment as ProjectWizardDraft['deployment'] | undefined) },
  } as ProjectWizardDraft;
}

function buildFinalizePayload(draft: ProjectWizardDraft) {
  const tags = draft.tech.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const documentUrls = draft.requirements.documentUrls.split('\n').map((t) => t.trim()).filter(Boolean);
  const requirements = [draft.requirements.goals, draft.requirements.functionality].filter(Boolean).join('\n\n');

  return {
    basicInfo: {
      name: draft.basicInfo.name,
      code: draft.basicInfo.code,
      description: draft.basicInfo.description || undefined,
      projectKind: draft.basicInfo.projectKind,
      status: draft.basicInfo.status,
      projectManagerId: draft.basicInfo.projectManagerId,
      clientName: draft.basicInfo.projectKind === 'external' ? draft.basicInfo.clientName || undefined : undefined,
      startDate: draft.basicInfo.startDate || undefined,
      endDate: draft.basicInfo.endDate || undefined,
      requirements: requirements || undefined,
      uiDocs: draft.requirements.uiDocs || undefined,
      scalabilityNotes: draft.tech.scalabilityNotes || undefined,
      tags,
    },
    repository: {
      repositoryUrl: draft.deployment.repositoryUrl || undefined,
      productionUrl: draft.deployment.deploymentUrl || undefined,
      envVariables: draft.deployment.envVariables || undefined,
      deploymentGuide: draft.deployment.deploymentGuide || undefined,
      documentUrls: documentUrls.length > 0 ? documentUrls : undefined,
    },
    documentUrls,
    teamMembers: draft.teamMembers.filter((m) => m.employeeId),
  };
}

export function ProjectCreateWizardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<ProjectWizardDraft>(() => loadLocalWizardDraft() ?? EMPTY_PROJECT_WIZARD_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEnv, setShowEnv] = useState(false);

  const { data: remoteDraft } = useProjectWizardDraft();
  const saveDraftMutation = useSaveProjectWizardDraft();
  const finalizeMutation = useFinalizeProjectWizard();
  const { data: employees } = useAllEmployees({ status: 'active' });

  const step = PROJECT_WIZARD_STEPS[draft.currentStepIndex];
  const employeeOptions = employees ?? [];

  useEffect(() => {
    if (remoteDraft?.payload) {
      setDraft((prev) => mergeDraft(prev, remoteDraft.payload as Record<string, unknown>));
      if (remoteDraft.currentStep) {
        const idx = wizardStepIndex(remoteDraft.currentStep);
        if (idx >= 0) setDraft((prev) => ({ ...prev, currentStepIndex: idx }));
      }
    }
  }, [remoteDraft]);

  useEffect(() => {
    saveLocalWizardDraft(draft);
  }, [draft]);

  useEffect(() => {
    const stepId = searchParams.get('step');
    if (!stepId) return;
    const index = wizardStepIndex(stepId);
    if (index >= 0) {
      setDraft((prev) => ({ ...prev, currentStepIndex: index }));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const employeeName = useMemo(() => {
    const map = new Map(employeeOptions.map((e) => [e.id, `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim()]));
    return (id: string) => map.get(id) ?? id;
  }, [employeeOptions]);

  async function persistDraft(nextIndex = draft.currentStepIndex) {
    if (saveDraftMutation.isPending) return;
    const currentStep = PROJECT_WIZARD_STEPS[nextIndex]?.id ?? step.id;
    setSaving(true);
    setError(null);
    const saved = await runFormMutation({
      setError,
      successMessage: 'Draft saved.',
      mutation: () =>
        saveDraftMutation.mutateAsync({ currentStep, payload: draft as unknown as Record<string, unknown> }),
    });
    setSaving(false);
    if (!saved) return;
  }

  function nextStep() {
    const nextIndex = Math.min(draft.currentStepIndex + 1, PROJECT_WIZARD_STEPS.length - 1);
    setDraft((prev) => ({ ...prev, currentStepIndex: nextIndex }));
    void persistDraft(nextIndex);
  }

  function prevStep() {
    setDraft((prev) => ({ ...prev, currentStepIndex: Math.max(prev.currentStepIndex - 1, 0) }));
  }

  async function handleFinalize() {
    if (!draft.basicInfo.name || !draft.basicInfo.code || !draft.basicInfo.projectManagerId) {
      setError('Name, code, and project manager are required.');
      return;
    }
    if (finalizeMutation.isPending) return;
    setSaving(true);
    setError(null);
    const created = await runFormMutation({
      setError,
      successMessage: 'Project created successfully.',
      mutation: () => finalizeMutation.mutateAsync(buildFinalizePayload(draft)),
      onSuccess: (project) => {
        clearLocalWizardDraft();
        navigate(ROUTES.projectDetail(project.id));
      },
    });
    setSaving(false);
    if (!created) return;
  }

  function updateBasic(field: keyof ProjectWizardDraft['basicInfo'], value: string) {
    setDraft((prev) => ({ ...prev, basicInfo: { ...prev.basicInfo, [field]: value } }));
  }

  function updateRequirements(field: keyof ProjectWizardDraft['requirements'], value: string) {
    setDraft((prev) => ({ ...prev, requirements: { ...prev.requirements, [field]: value } }));
  }

  function updateTech(field: keyof ProjectWizardDraft['tech'], value: string | string[]) {
    setDraft((prev) => ({ ...prev, tech: { ...prev.tech, [field]: value } }));
  }

  function updateDeployment(field: keyof ProjectWizardDraft['deployment'], value: string) {
    setDraft((prev) => ({ ...prev, deployment: { ...prev.deployment, [field]: value } }));
  }

  function addTeamMember() {
    setDraft((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { employeeId: '', role: 'developer', allocationPercent: 100 }],
    }));
  }

  function updateTeamMember(index: number, field: keyof WizardTeamMember, value: string | number) {
    setDraft((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  }

  function exportEnvFile() {
    const blob = new Blob([draft.deployment.envVariables], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.basicInfo.code || 'project'}-env.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Briefcase className="h-6 w-6 text-primary" />}
        title="Create Project"
        description="Set up a new project with requirements, tech stack, deployment, and team."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.PROJECTS_LIST}>Back to Projects</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="space-y-1 rounded-lg border bg-card p-4">
          {PROJECT_WIZARD_STEPS.map((s, index) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, currentStepIndex: index }))}
              className={cn(
                'flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                index === draft.currentStepIndex ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
                index < draft.currentStepIndex && 'text-foreground',
              )}
            >
              {index < draft.currentStepIndex ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs">{index + 1}</span>
              )}
              <span className="block font-medium">{s.title}</span>
            </button>
          ))}
        </nav>

        <section className="rounded-lg border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>

          {step.id === 'basic' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Project Name *"><Input value={draft.basicInfo.name} onChange={(e) => updateBasic('name', e.target.value)} /></Field>
              <Field label="Project Code *"><Input value={draft.basicInfo.code} onChange={(e) => updateBasic('code', e.target.value.toUpperCase())} /></Field>
              <Field label="Project Type *">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.projectKind} onChange={(e) => updateBasic('projectKind', e.target.value)}>
                  {PROJECT_KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.status} onChange={(e) => updateBasic('status', e.target.value)}>
                  {PROJECT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Project Manager *">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.projectManagerId} onChange={(e) => updateBasic('projectManagerId', e.target.value)}>
                  <option value="">Select manager</option>
                  {employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </Field>
              {draft.basicInfo.projectKind === 'external' && (
                <Field label="Client Name"><Input value={draft.basicInfo.clientName} onChange={(e) => updateBasic('clientName', e.target.value)} /></Field>
              )}
              <Field label="Start Date (optional)"><DatePicker value={draft.basicInfo.startDate} onChange={(value) => updateBasic('startDate', value)} /></Field>
              <Field label="End Date (optional)"><DatePicker value={draft.basicInfo.endDate} onChange={(value) => updateBasic('endDate', value)} min={draft.basicInfo.startDate || undefined} /></Field>
              <div className="sm:col-span-2">
                <Field label="Summary"><textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.basicInfo.description} onChange={(e) => updateBasic('description', e.target.value)} /></Field>
              </div>
            </div>
          )}

          {step.id === 'requirements' && (
            <div className="space-y-4">
              <Field label="Project Goals"><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.requirements.goals} onChange={(e) => updateRequirements('goals', e.target.value)} placeholder="What should this project achieve?" /></Field>
              <Field label="Functionality & Scope"><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.requirements.functionality} onChange={(e) => updateRequirements('functionality', e.target.value)} placeholder="Core features and user flows" /></Field>
              <Field label="UI / Design Docs"><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.requirements.uiDocs} onChange={(e) => updateRequirements('uiDocs', e.target.value)} placeholder="Wireframes, Figma links, design notes" /></Field>
              <Field label="Reference Document URLs (one per line)"><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.requirements.documentUrls} onChange={(e) => updateRequirements('documentUrls', e.target.value)} /></Field>
            </div>
          )}

          {step.id === 'tech' && (
            <div className="space-y-4">
              <Field label="Scalability Notes"><textarea className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.tech.scalabilityNotes} onChange={(e) => updateTech('scalabilityNotes', e.target.value)} placeholder="Architecture, scaling strategy, infra choices..." /></Field>
              <Field label="Tags (comma-separated)"><Input value={draft.tech.tags} onChange={(e) => updateTech('tags', e.target.value)} placeholder="backend, mobile, api" /></Field>
            </div>
          )}

          {step.id === 'deployment' && (
            <div className="space-y-4">
              <Field label="GitHub / Repository URL"><Input value={draft.deployment.repositoryUrl} onChange={(e) => updateDeployment('repositoryUrl', e.target.value)} placeholder="https://github.com/org/repo" /></Field>
              <Field label="Deployment URL"><Input value={draft.deployment.deploymentUrl} onChange={(e) => updateDeployment('deploymentUrl', e.target.value)} placeholder="https://app.example.com" /></Field>
              <Field label="Environment Variables (encrypted at rest)">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowEnv((v) => !v)}>
                      {showEnv ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                      {showEnv ? 'Hide' : 'View'}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={exportEnvFile} disabled={!draft.deployment.envVariables}>
                      Export .env file
                    </Button>
                  </div>
                  <textarea
                    className={cn('min-h-32 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm', !showEnv && 'text-security-disc')}
                    style={!showEnv ? { WebkitTextSecurity: 'disc' } as React.CSSProperties : undefined}
                    value={draft.deployment.envVariables}
                    onChange={(e) => updateDeployment('envVariables', e.target.value)}
                    placeholder="KEY=value&#10;DB_URL=..."
                  />
                </div>
              </Field>
              <Field label="Deployment Notes"><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.deployment.deploymentGuide} onChange={(e) => updateDeployment('deploymentGuide', e.target.value)} /></Field>
            </div>
          )}

          {step.id === 'team' && (
            <div className="space-y-4">
              {draft.teamMembers.map((member, index) => (
                <div key={index} className="grid gap-3 rounded border p-4 sm:grid-cols-3">
                  <Field label="Employee">
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={member.employeeId} onChange={(e) => updateTeamMember(index, 'employeeId', e.target.value)}>
                      <option value="">Select</option>
                      {employeeOptions.filter((e) => e.id !== draft.basicInfo.projectManagerId).map((e) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Role">
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={member.role} onChange={(e) => updateTeamMember(index, 'role', e.target.value)}>
                      {MEMBER_ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Allocation %"><Input type="number" min={0} max={100} value={member.allocationPercent ?? 100} onChange={(e) => updateTeamMember(index, 'allocationPercent', Number(e.target.value))} /></Field>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addTeamMember}>Add Team Member</Button>
            </div>
          )}

          {step.id === 'review' && (
            <div className="space-y-3 text-sm">
              <ReviewRow label="Project" value={`${draft.basicInfo.name} (${draft.basicInfo.code})`} />
              <ReviewRow label="Type" value={draft.basicInfo.projectKind} />
              <ReviewRow label="Status" value={draft.basicInfo.status} />
              <ReviewRow label="Manager" value={employeeName(draft.basicInfo.projectManagerId)} />
              <ReviewRow label="Repository" value={draft.deployment.repositoryUrl || '—'} />
              <ReviewRow label="Deployment" value={draft.deployment.deploymentUrl || '—'} />
              <ReviewRow label="Team Members" value={String(draft.teamMembers.filter((m) => m.employeeId).length)} />
              <ReviewRow label="Tags" value={draft.tech.tags || '—'} />
              <ReviewRow label="Env Variables" value={draft.deployment.envVariables ? 'Configured (encrypted)' : 'None'} />
            </div>
          )}

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={prevStep} disabled={draft.currentStepIndex === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => void persistDraft()} disabled={saving}>
                <Save className="mr-1 h-4 w-4" /> Save Draft
              </Button>
              {step.id === 'review' ? (
                <Button type="button" onClick={() => void handleFinalize()} disabled={saving}>
                  Create Project
                </Button>
              ) : (
                <Button type="button" onClick={nextStep}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
