import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, CheckCircle2, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import {
  EMPTY_PROJECT_WIZARD_DRAFT,
  MEMBER_ROLE_OPTIONS,
  PROJECT_WIZARD_STEPS,
  clearLocalWizardDraft,
  loadLocalWizardDraft,
  saveLocalWizardDraft,
  wizardStepIndex,
  type ProjectWizardDraft,
  type WizardMilestone,
  type WizardModule,
  type WizardTeamMember,
} from '@/features/project/constants/project-wizard-steps';
import {
  useFinalizeProjectWizard,
  useProjectWizardDraft,
  useSaveProjectWizardDraft,
} from '@/features/project/hooks/use-projects';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';
import { cn } from '@/shared/utils/cn';

function mergeDraft(local: ProjectWizardDraft, remote: Record<string, unknown> | undefined): ProjectWizardDraft {
  if (!remote || Object.keys(remote).length === 0) return local;
  return { ...local, ...(remote as Partial<ProjectWizardDraft>) };
}

function buildFinalizePayload(draft: ProjectWizardDraft) {
  const tags = draft.basicInfo.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const labels = draft.labels.split(',').map((t) => t.trim()).filter(Boolean);
  const documentUrls = draft.documentUrls.split('\n').map((t) => t.trim()).filter(Boolean);

  return {
    basicInfo: {
      name: draft.basicInfo.name,
      code: draft.basicInfo.code,
      description: draft.basicInfo.description || undefined,
      status: draft.basicInfo.status,
      priority: draft.basicInfo.priority,
      categoryId: draft.basicInfo.categoryId || undefined,
      branchId: draft.basicInfo.branchId || undefined,
      departmentId: draft.basicInfo.departmentId || undefined,
      startDate: draft.basicInfo.startDate,
      targetDate: draft.basicInfo.targetDate || undefined,
      projectManagerId: draft.basicInfo.projectManagerId,
      clientName: draft.basicInfo.clientName || undefined,
      budget: draft.basicInfo.budget ? Number(draft.basicInfo.budget) : undefined,
      currency: draft.basicInfo.currency,
      riskLevel: draft.basicInfo.riskLevel,
      visibility: draft.basicInfo.visibility,
      tags: [...tags, ...labels],
      technologyIds: draft.technologyIds,
    },
    repository: {
      repositoryUrl: draft.repository.repositoryUrl || undefined,
      defaultBranch: draft.repository.defaultBranch || undefined,
      productionUrl: draft.repository.productionUrl || undefined,
      stagingUrl: draft.repository.stagingUrl || undefined,
      apiUrl: draft.repository.apiUrl || undefined,
      swaggerUrl: draft.repository.swaggerUrl || undefined,
      documentationUrl: draft.repository.documentationUrl || undefined,
      deploymentUrl: draft.repository.deploymentUrl || undefined,
      apiDocsUrl: draft.repository.apiDocsUrl || undefined,
      envVariables: draft.environment.envVariables || undefined,
      credentials: draft.environment.credentials || undefined,
      deploymentGuide: draft.environment.deploymentGuide || undefined,
      architectureNotes: draft.environment.architectureNotes || undefined,
      documentUrls: documentUrls.length > 0 ? documentUrls : undefined,
    },
    technologyIds: draft.technologyIds,
    documentUrls,
    modules: draft.modules.map((m) => ({ name: m.name, description: m.description })),
    milestones: draft.milestones.map((m) => ({ name: m.name, description: m.description, dueDate: m.dueDate })),
    sprint: draft.sprint.name ? draft.sprint : undefined,
    assistantManagerIds: draft.assistantManagerIds,
    teamMembers: draft.teamMembers,
    labels,
    taskCategories: draft.taskCategories.split(',').map((t) => t.trim()).filter(Boolean),
  };
}

export function ProjectCreateWizardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<ProjectWizardDraft>(() => loadLocalWizardDraft() ?? EMPTY_PROJECT_WIZARD_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: remoteDraft } = useProjectWizardDraft();
  const saveDraftMutation = useSaveProjectWizardDraft();
  const finalizeMutation = useFinalizeProjectWizard();
  const { data: employees } = useEmployees({ pageSize: 300, status: 'active' });
  const { data: branches } = useMasterDataList('branch', { pageSize: 100 });
  const { data: departments } = useMasterDataList('department', { pageSize: 100 });
  const { data: categories } = useMasterDataList('project-category', { pageSize: 100 });
  const { data: technologies } = useMasterDataList('technology', { pageSize: 200 });

  const step = PROJECT_WIZARD_STEPS[draft.currentStepIndex];
  const employeeOptions = employees?.items ?? [];

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
    const currentStep = PROJECT_WIZARD_STEPS[nextIndex]?.id ?? step.id;
    setSaving(true);
    setError(null);
    try {
      await saveDraftMutation.mutateAsync({ currentStep, payload: draft as unknown as Record<string, unknown> });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
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
    setSaving(true);
    setError(null);
    try {
      const project = await finalizeMutation.mutateAsync(buildFinalizePayload(draft));
      clearLocalWizardDraft();
      navigate(ROUTES.projectDetail(project.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
    } finally {
      setSaving(false);
    }
  }

  function updateBasic(field: keyof ProjectWizardDraft['basicInfo'], value: string) {
    setDraft((prev) => ({ ...prev, basicInfo: { ...prev.basicInfo, [field]: value } }));
  }

  function updateRepository(field: keyof ProjectWizardDraft['repository'], value: string) {
    setDraft((prev) => ({ ...prev, repository: { ...prev.repository, [field]: value } }));
  }

  function updateEnvironment(field: keyof ProjectWizardDraft['environment'], value: string) {
    setDraft((prev) => ({ ...prev, environment: { ...prev.environment, [field]: value } }));
  }

  function addModule() {
    setDraft((prev) => ({ ...prev, modules: [...prev.modules, { name: '', description: '' }] }));
  }

  function updateModule(index: number, field: keyof WizardModule, value: string) {
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  }

  function addMilestone() {
    setDraft((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { name: '', description: '', dueDate: new Date().toISOString().slice(0, 10) }],
    }));
  }

  function updateMilestone(index: number, field: keyof WizardMilestone, value: string) {
    setDraft((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
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

  function toggleTechnology(id: string) {
    setDraft((prev) => ({
      ...prev,
      technologyIds: prev.technologyIds.includes(id)
        ? prev.technologyIds.filter((t) => t !== id)
        : [...prev.technologyIds, id],
    }));
  }

  function toggleAssistantManager(id: string) {
    setDraft((prev) => ({
      ...prev,
      assistantManagerIds: prev.assistantManagerIds.includes(id)
        ? prev.assistantManagerIds.filter((m) => m !== id)
        : [...prev.assistantManagerIds, id],
    }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Briefcase className="h-6 w-6 text-primary" />}
        title="Create Company Project"
        description="Enterprise project creation wizard with draft saving at every step."
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
              <span>
                <span className="block font-medium">{s.title}</span>
              </span>
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
              <Field label="Client"><Input value={draft.basicInfo.clientName} onChange={(e) => updateBasic('clientName', e.target.value)} /></Field>
              <Field label="Status">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.status} onChange={(e) => updateBasic('status', e.target.value)}>
                  {['planning', 'active', 'on_hold'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.priority} onChange={(e) => updateBasic('priority', e.target.value)}>
                  {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Risk Level">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.riskLevel} onChange={(e) => updateBasic('riskLevel', e.target.value)}>
                  {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Visibility">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.visibility} onChange={(e) => updateBasic('visibility', e.target.value)}>
                  {['internal', 'private', 'public'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Branch">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.branchId} onChange={(e) => updateBasic('branchId', e.target.value)}>
                  <option value="">Select branch</option>
                  {(branches?.items ?? []).map((b) => <option key={b.id} value={b.id}>{String(b.name)}</option>)}
                </select>
              </Field>
              <Field label="Department">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.departmentId} onChange={(e) => updateBasic('departmentId', e.target.value)}>
                  <option value="">Select department</option>
                  {(departments?.items ?? []).map((d) => <option key={d.id} value={d.id}>{String(d.name)}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.categoryId} onChange={(e) => updateBasic('categoryId', e.target.value)}>
                  <option value="">Select category</option>
                  {(categories?.items ?? []).map((c) => <option key={c.id} value={c.id}>{String(c.name)}</option>)}
                </select>
              </Field>
              <Field label="Start Date *"><Input type="date" value={draft.basicInfo.startDate} onChange={(e) => updateBasic('startDate', e.target.value)} /></Field>
              <Field label="Expected Completion"><Input type="date" value={draft.basicInfo.targetDate} onChange={(e) => updateBasic('targetDate', e.target.value)} /></Field>
              <Field label="Budget"><Input type="number" min={0} value={draft.basicInfo.budget} onChange={(e) => updateBasic('budget', e.target.value)} /></Field>
              <Field label="Tags (comma-separated)"><Input value={draft.basicInfo.tags} onChange={(e) => updateBasic('tags', e.target.value)} /></Field>
              <div className="sm:col-span-2">
                <Field label="Description"><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.basicInfo.description} onChange={(e) => updateBasic('description', e.target.value)} /></Field>
              </div>
            </div>
          )}

          {step.id === 'repository' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Git Repository"><Input value={draft.repository.repositoryUrl} onChange={(e) => updateRepository('repositoryUrl', e.target.value)} placeholder="https://github.com/org/repo" /></Field>
              <Field label="Default Branch"><Input value={draft.repository.defaultBranch} onChange={(e) => updateRepository('defaultBranch', e.target.value)} /></Field>
              <Field label="Production URL"><Input value={draft.repository.productionUrl} onChange={(e) => updateRepository('productionUrl', e.target.value)} /></Field>
              <Field label="Staging URL"><Input value={draft.repository.stagingUrl} onChange={(e) => updateRepository('stagingUrl', e.target.value)} /></Field>
              <Field label="API URL"><Input value={draft.repository.apiUrl} onChange={(e) => updateRepository('apiUrl', e.target.value)} /></Field>
              <Field label="Swagger URL"><Input value={draft.repository.swaggerUrl} onChange={(e) => updateRepository('swaggerUrl', e.target.value)} /></Field>
              <Field label="Documentation URL"><Input value={draft.repository.documentationUrl} onChange={(e) => updateRepository('documentationUrl', e.target.value)} /></Field>
              <Field label="Deployment URL"><Input value={draft.repository.deploymentUrl} onChange={(e) => updateRepository('deploymentUrl', e.target.value)} /></Field>
            </div>
          )}

          {step.id === 'environment' && (
            <div className="space-y-4">
              <Field label="Environment Variables (encrypted at rest)">
                <textarea className="min-h-32 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm" value={draft.environment.envVariables} onChange={(e) => updateEnvironment('envVariables', e.target.value)} placeholder="KEY=value&#10;DB_URL=..." />
              </Field>
              <Field label="Credentials (encrypted at rest)">
                <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm" value={draft.environment.credentials} onChange={(e) => updateEnvironment('credentials', e.target.value)} />
              </Field>
              <Field label="Deployment Notes"><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.environment.deploymentGuide} onChange={(e) => updateEnvironment('deploymentGuide', e.target.value)} /></Field>
              <Field label="Architecture Notes"><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.environment.architectureNotes} onChange={(e) => updateEnvironment('architectureNotes', e.target.value)} /></Field>
            </div>
          )}

          {step.id === 'technology' && (
            <div className="space-y-4">
              <Field label="Technologies">
                <div className="flex flex-wrap gap-2">
                  {(technologies?.items ?? []).map((tech) => (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => toggleTechnology(tech.id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-sm',
                        draft.technologyIds.includes(tech.id) ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {String(tech.name)}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Labels"><Input value={draft.labels} onChange={(e) => setDraft((prev) => ({ ...prev, labels: e.target.value }))} placeholder="backend, mobile, api" /></Field>
              <Field label="Task Categories"><Input value={draft.taskCategories} onChange={(e) => setDraft((prev) => ({ ...prev, taskCategories: e.target.value }))} placeholder="feature, bug, chore" /></Field>
            </div>
          )}

          {step.id === 'documents' && (
            <Field label="Document URLs (one per line)">
              <textarea className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.documentUrls} onChange={(e) => setDraft((prev) => ({ ...prev, documentUrls: e.target.value }))} placeholder="https://docs.example.com/architecture.pdf" />
            </Field>
          )}

          {step.id === 'modules' && (
            <div className="space-y-4">
              {draft.modules.map((mod, index) => (
                <div key={index} className="grid gap-3 rounded border p-4 sm:grid-cols-2">
                  <Field label="Module Name"><Input value={mod.name} onChange={(e) => updateModule(index, 'name', e.target.value)} /></Field>
                  <Field label="Description"><Input value={mod.description ?? ''} onChange={(e) => updateModule(index, 'description', e.target.value)} /></Field>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addModule}>Add Module</Button>
            </div>
          )}

          {step.id === 'milestones' && (
            <div className="space-y-4">
              {draft.milestones.map((ms, index) => (
                <div key={index} className="grid gap-3 rounded border p-4 sm:grid-cols-3">
                  <Field label="Name"><Input value={ms.name} onChange={(e) => updateMilestone(index, 'name', e.target.value)} /></Field>
                  <Field label="Due Date"><Input type="date" value={ms.dueDate} onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)} /></Field>
                  <Field label="Description"><Input value={ms.description ?? ''} onChange={(e) => updateMilestone(index, 'description', e.target.value)} /></Field>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addMilestone}>Add Milestone</Button>
            </div>
          )}

          {step.id === 'sprint' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sprint Name"><Input value={draft.sprint.name} onChange={(e) => setDraft((prev) => ({ ...prev, sprint: { ...prev.sprint, name: e.target.value } }))} /></Field>
              <Field label="Goal"><Input value={draft.sprint.goal ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, sprint: { ...prev.sprint, goal: e.target.value } }))} /></Field>
              <Field label="Start Date"><Input type="date" value={draft.sprint.startDate} onChange={(e) => setDraft((prev) => ({ ...prev, sprint: { ...prev.sprint, startDate: e.target.value } }))} /></Field>
              <Field label="End Date"><Input type="date" value={draft.sprint.endDate} onChange={(e) => setDraft((prev) => ({ ...prev, sprint: { ...prev.sprint, endDate: e.target.value } }))} /></Field>
            </div>
          )}

          {step.id === 'manager' && (
            <div className="space-y-4">
              <Field label="Primary Project Manager *">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.basicInfo.projectManagerId} onChange={(e) => updateBasic('projectManagerId', e.target.value)}>
                  <option value="">Select manager</option>
                  {employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </Field>
              <Field label="Assistant Project Managers">
                <div className="max-h-48 space-y-2 overflow-y-auto rounded border p-3">
                  {employeeOptions.filter((e) => e.id !== draft.basicInfo.projectManagerId).map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={draft.assistantManagerIds.includes(e.id)} onChange={() => toggleAssistantManager(e.id)} />
                      {e.firstName} {e.lastName}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step.id === 'team' && (
            <div className="space-y-4">
              {draft.teamMembers.map((member, index) => (
                <div key={index} className="grid gap-3 rounded border p-4 sm:grid-cols-3">
                  <Field label="Employee">
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={member.employeeId} onChange={(e) => updateTeamMember(index, 'employeeId', e.target.value)}>
                      <option value="">Select</option>
                      {employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                    </select>
                  </Field>
                  <Field label="Role">
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={member.role} onChange={(e) => updateTeamMember(index, 'role', e.target.value)}>
                      {MEMBER_ROLE_OPTIONS.filter((r) => r.value !== 'project_manager').map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
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
              <ReviewRow label="Manager" value={employeeName(draft.basicInfo.projectManagerId)} />
              <ReviewRow label="Client" value={draft.basicInfo.clientName || '—'} />
              <ReviewRow label="Repository" value={draft.repository.repositoryUrl || '—'} />
              <ReviewRow label="Modules" value={String(draft.modules.length)} />
              <ReviewRow label="Milestones" value={String(draft.milestones.length)} />
              <ReviewRow label="Team Members" value={String(draft.teamMembers.filter((m) => m.employeeId).length)} />
              <ReviewRow label="Technologies" value={String(draft.technologyIds.length)} />
              <ReviewRow label="Env Variables" value={draft.environment.envVariables ? 'Configured (encrypted)' : 'None'} />
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
