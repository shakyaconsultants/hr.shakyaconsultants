import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useArchiveProject,
  useAssignProjectMember,
  useCreateProjectMilestone,
  useCreateProjectModule,
  useCreateProjectSprint,
  useDeleteProject,
  useDeleteProjectMilestone,
  useDeleteProjectModule,
  useProjectKnowledgeBase,
  useProjectMembers,
  useProjectMilestones,
  useProjectModules,
  useProjectSprints,
  useRemoveProjectMember,
  useRestoreProject,
  useUpdateProject,
  useUpsertProjectKnowledgeBase,
} from '@/features/project/hooks/use-projects';
import type { ProjectRecord } from '@/features/project/api/project.api';
import { ProjectManagerSelect } from '@/features/project/components/project-manager-select';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { DatePicker } from '@/shared/components/date-picker';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { ROUTES } from '@/config/app.config';
import {
  runActionMutation,
  runDeleteMutation,
  runFormMutation,
} from '@/shared/feedback/run-form-mutation';
import { useAuthStore } from '@/shared/stores/app.store';

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const MEMBER_ROLES = [
  'project_manager',
  'assistant_project_manager',
  'developer',
  'qa',
  'designer',
  'devops',
  'business_analyst',
  'intern',
  'owner',
  'viewer',
];

export interface ProjectAdministrationPanelProps {
  project: ProjectRecord;
}

export function ProjectAdministrationPanel({ project }: ProjectAdministrationPanelProps) {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canUpdate = hasPermission('project.update');
  const canDelete = hasPermission('project.delete');

  const { data: employees } = useAllEmployees({ status: 'active' });
  const { data: members = [], refetch: refetchMembers } = useProjectMembers(project.id);
  const { data: modules = [], refetch: refetchModules } = useProjectModules(project.id);
  const { data: milestones = [], refetch: refetchMilestones } = useProjectMilestones(project.id);
  const { data: sprints = [], refetch: refetchSprints } = useProjectSprints(project.id);
  const { data: knowledgeBase } = useProjectKnowledgeBase(project.id);

  const updateMutation = useUpdateProject();
  const archiveMutation = useArchiveProject();
  const restoreMutation = useRestoreProject();
  const deleteMutation = useDeleteProject();
  const assignMemberMutation = useAssignProjectMember();
  const removeMemberMutation = useRemoveProjectMember();
  const createModuleMutation = useCreateProjectModule();
  const deleteModuleMutation = useDeleteProjectModule();
  const createMilestoneMutation = useCreateProjectMilestone();
  const deleteMilestoneMutation = useDeleteProjectMilestone();
  const createSprintMutation = useCreateProjectSprint();
  const upsertKbMutation = useUpsertProjectKnowledgeBase();

  const [settingsForm, setSettingsForm] = useState({
    name: project.name,
    description: project.description ?? '',
    status: project.status,
    priority: project.priority,
    clientName: project.clientName ?? '',
    projectManagerId: project.projectManagerId,
    startDate: project.startDate?.slice(0, 10) ?? '',
    targetDate: project.targetDate?.slice(0, 10) ?? '',
    repositoryUrl: '',
    productionUrl: '',
    stagingUrl: '',
  });

  const [memberForm, setMemberForm] = useState({ employeeId: '', role: 'developer' });
  const [moduleForm, setModuleForm] = useState({ name: '', description: '' });
  const [milestoneForm, setMilestoneForm] = useState({ name: '', dueDate: '' });
  const [sprintForm, setSprintForm] = useState({ name: '', startDate: '', endDate: '', goal: '' });
  const [kbForm, setKbForm] = useState({
    repositoryUrl: '',
    productionUrl: '',
    stagingUrl: '',
    envVariables: '',
    deploymentGuide: '',
    architectureNotes: '',
    cloudflareEmail: '',
    devHostingPlatform: '',
    prodHostingPlatform: '',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      priority: project.priority,
      clientName: project.clientName ?? '',
      projectManagerId: project.projectManagerId,
      startDate: project.startDate?.slice(0, 10) ?? '',
      targetDate: project.targetDate?.slice(0, 10) ?? '',
      repositoryUrl: project.repositoryUrl ?? '',
      productionUrl: project.productionUrl ?? '',
      stagingUrl: project.stagingUrl ?? '',
    });
  }, [project]);

  useEffect(() => {
    setKbForm((prev) => ({
      ...prev,
      repositoryUrl: knowledgeBase?.repositoryUrl ?? project.repositoryUrl ?? prev.repositoryUrl,
      productionUrl: project.productionUrl ?? prev.productionUrl,
      stagingUrl: project.stagingUrl ?? prev.stagingUrl,
      envVariables: knowledgeBase?.envVariables ?? prev.envVariables,
      deploymentGuide: knowledgeBase?.deploymentGuide ?? prev.deploymentGuide,
      architectureNotes: knowledgeBase?.architectureNotes ?? prev.architectureNotes,
      cloudflareEmail: knowledgeBase?.cloudflareEmail ?? prev.cloudflareEmail,
      devHostingPlatform: knowledgeBase?.devHostingPlatform ?? prev.devHostingPlatform,
      prodHostingPlatform: knowledgeBase?.prodHostingPlatform ?? prev.prodHostingPlatform,
    }));
  }, [knowledgeBase, project.repositoryUrl, project.productionUrl, project.stagingUrl]);

  if (!canUpdate && !canDelete) {
    return null;
  }

  async function saveSettings() {
    if (updateMutation.isPending) {
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Project settings saved successfully.',
      mutation: () =>
        updateMutation.mutateAsync({
          id: project.id,
          payload: {
            name: settingsForm.name,
            description: settingsForm.description || undefined,
            status: settingsForm.status,
            priority: settingsForm.priority,
            clientName: settingsForm.clientName || undefined,
            projectManagerId: settingsForm.projectManagerId,
            startDate: settingsForm.startDate,
            targetDate: settingsForm.targetDate || undefined,
            repositoryUrl: settingsForm.repositoryUrl || undefined,
            productionUrl: settingsForm.productionUrl || undefined,
            stagingUrl: settingsForm.stagingUrl || undefined,
          },
        }),
    });
  }

  async function handleDelete() {
    await runDeleteMutation({
      setError: setDeleteError,
      entityLabel: 'Project',
      successMessage: 'Project deleted successfully.',
      mutation: () => deleteMutation.mutateAsync(project.id),
      onSuccess: () => {
        setConfirmDelete(false);
        navigate(ROUTES.PROJECTS_LIST);
      },
    });
  }

  async function assignMember() {
    if (!memberForm.employeeId || assignMemberMutation.isPending) {
      return;
    }
    await runActionMutation({
      successMessage: 'Team member assigned successfully.',
      mutation: () => assignMemberMutation.mutateAsync({ projectId: project.id, ...memberForm }),
      onSuccess: () => {
        setMemberForm({ employeeId: '', role: 'developer' });
        void refetchMembers();
      },
    });
  }

  async function removeMember(memberId: string) {
    await runActionMutation({
      successMessage: 'Team member removed successfully.',
      mutation: () => removeMemberMutation.mutateAsync({ memberId, projectId: project.id }),
      onSuccess: () => void refetchMembers(),
    });
  }

  async function addModule() {
    if (!moduleForm.name || createModuleMutation.isPending) {
      return;
    }
    await runActionMutation({
      successMessage: 'Module added successfully.',
      mutation: () =>
        createModuleMutation.mutateAsync({
          projectId: project.id,
          name: moduleForm.name,
          description: moduleForm.description || undefined,
        }),
      onSuccess: () => {
        setModuleForm({ name: '', description: '' });
        void refetchModules();
      },
    });
  }

  async function removeModule(moduleId: string) {
    await runDeleteMutation({
      entityLabel: 'Module',
      successMessage: 'Module deleted successfully.',
      mutation: () => deleteModuleMutation.mutateAsync({ moduleId, projectId: project.id }),
      onSuccess: () => void refetchModules(),
    });
  }

  async function addMilestone() {
    if (!milestoneForm.name || !milestoneForm.dueDate || createMilestoneMutation.isPending) {
      return;
    }
    await runActionMutation({
      successMessage: 'Milestone added successfully.',
      mutation: () =>
        createMilestoneMutation.mutateAsync({
          projectId: project.id,
          name: milestoneForm.name,
          dueDate: milestoneForm.dueDate,
        }),
      onSuccess: () => {
        setMilestoneForm({ name: '', dueDate: '' });
        void refetchMilestones();
      },
    });
  }

  async function removeMilestone(milestoneId: string) {
    await runDeleteMutation({
      entityLabel: 'Milestone',
      successMessage: 'Milestone deleted successfully.',
      mutation: () => deleteMilestoneMutation.mutateAsync({ milestoneId, projectId: project.id }),
      onSuccess: () => void refetchMilestones(),
    });
  }

  async function addSprint() {
    if (
      !sprintForm.name ||
      !sprintForm.startDate ||
      !sprintForm.endDate ||
      createSprintMutation.isPending
    ) {
      return;
    }
    await runActionMutation({
      successMessage: 'Sprint added successfully.',
      mutation: () =>
        createSprintMutation.mutateAsync({
          projectId: project.id,
          name: sprintForm.name,
          startDate: sprintForm.startDate,
          endDate: sprintForm.endDate,
          goal: sprintForm.goal || undefined,
        }),
      onSuccess: () => {
        setSprintForm({ name: '', startDate: '', endDate: '', goal: '' });
        void refetchSprints();
      },
    });
  }

  async function saveKnowledgeBase() {
    if (upsertKbMutation.isPending || updateMutation.isPending) {
      return;
    }
    await runFormMutation({
      setError,
      successMessage: 'Deployment settings saved successfully.',
      mutation: async () => {
        await upsertKbMutation.mutateAsync({
          projectId: project.id,
          payload: {
            repositoryUrl: kbForm.repositoryUrl || undefined,
            deploymentGuide: kbForm.deploymentGuide || undefined,
            architectureNotes: kbForm.architectureNotes || undefined,
            cloudflareEmail: kbForm.cloudflareEmail || undefined,
            devHostingPlatform: kbForm.devHostingPlatform || undefined,
            prodHostingPlatform: kbForm.prodHostingPlatform || undefined,
            envVariables: kbForm.envVariables || undefined,
          },
        });
        await updateMutation.mutateAsync({
          id: project.id,
          payload: {
            repositoryUrl: kbForm.repositoryUrl || undefined,
            productionUrl: kbForm.productionUrl || undefined,
            stagingUrl: kbForm.stagingUrl || undefined,
          },
        });
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Enterprise Administration</h2>
          <p className="text-sm text-muted-foreground">
            Full project control — override permissions and configure all project assets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && !project.isArchived ? (
            <Button
              variant="outline"
              size="sm"
              disabled={archiveMutation.isPending}
              onClick={() =>
                void runActionMutation({
                  successMessage: 'Project archived successfully.',
                  mutation: () => archiveMutation.mutateAsync(project.id),
                })
              }
            >
              Archive
            </Button>
          ) : null}
          {canUpdate && project.isArchived ? (
            <Button
              variant="outline"
              size="sm"
              disabled={restoreMutation.isPending}
              onClick={() =>
                void runActionMutation({
                  successMessage: 'Project restored successfully.',
                  mutation: () => restoreMutation.mutateAsync(project.id),
                })
              }
            >
              Restore
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {canUpdate ? (
        <>
          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Project Settings</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Name"
                value={settingsForm.name}
                onChange={(e) => setSettingsForm((p) => ({ ...p, name: e.target.value }))}
              />
              <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 font-mono text-sm text-muted-foreground">
                {project.code}
              </div>
              <Input
                placeholder="Client"
                value={settingsForm.clientName}
                onChange={(e) => setSettingsForm((p) => ({ ...p, clientName: e.target.value }))}
              />
              <select
                className="h-10 rounded-md border px-3 text-sm"
                value={settingsForm.status}
                onChange={(e) => setSettingsForm((p) => ({ ...p, status: e.target.value }))}
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border px-3 text-sm"
                value={settingsForm.priority}
                onChange={(e) => setSettingsForm((p) => ({ ...p, priority: e.target.value }))}
              >
                {PROJECT_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <ProjectManagerSelect
                className="rounded-md px-3"
                value={settingsForm.projectManagerId}
                onChange={(projectManagerId) =>
                  setSettingsForm((p) => ({ ...p, projectManagerId }))
                }
                placeholder="Select project manager"
                includeEmployeeId={project.projectManagerId}
              />
              <DatePicker
                value={settingsForm.startDate}
                onChange={(value) => setSettingsForm((p) => ({ ...p, startDate: value }))}
                max={settingsForm.targetDate || undefined}
              />
              <DatePicker
                value={settingsForm.targetDate}
                onChange={(value) => setSettingsForm((p) => ({ ...p, targetDate: value }))}
                min={settingsForm.startDate || undefined}
              />
            </div>
            <textarea
              className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Description"
              value={settingsForm.description}
              onChange={(e) => setSettingsForm((p) => ({ ...p, description: e.target.value }))}
            />
            <Button
              size="sm"
              onClick={() => void saveSettings()}
              disabled={updateMutation.isPending}
            >
              Save Settings
            </Button>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Team Members</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <select
                className="h-10 rounded-md border px-3 text-sm"
                value={memberForm.employeeId}
                onChange={(e) => setMemberForm((p) => ({ ...p, employeeId: e.target.value }))}
              >
                <option value="">Select employee</option>
                {(employees ?? []).map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border px-3 text-sm"
                value={memberForm.role}
                onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))}
              >
                {MEMBER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={() => void assignMember()}
                disabled={!memberForm.employeeId || assignMemberMutation.isPending}
              >
                Assign Member
              </Button>
            </div>
            <ul className="space-y-2">
              {members.map((member) => (
                <li
                  key={String(member.id)}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <span>
                    {member.employeeName ?? member.employeeEmail ?? member.employeeId} ·{' '}
                    {String(member.role).replace(/_/g, ' ')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void removeMember(String(member.id))}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Modules</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder="Module name"
                value={moduleForm.name}
                onChange={(e) => setModuleForm((p) => ({ ...p, name: e.target.value }))}
              />
              <Input
                placeholder="Description"
                value={moduleForm.description}
                onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))}
              />
              <Button
                size="sm"
                onClick={() => void addModule()}
                disabled={!moduleForm.name || createModuleMutation.isPending}
              >
                Add Module
              </Button>
            </div>
            <ul className="space-y-2">
              {modules.map((module) => (
                <li
                  key={String(module.id)}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <span>{String(module.name)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void removeModule(String(module.id))}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Milestones</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder="Milestone name"
                value={milestoneForm.name}
                onChange={(e) => setMilestoneForm((p) => ({ ...p, name: e.target.value }))}
              />
              <DatePicker
                value={milestoneForm.dueDate}
                onChange={(value) => setMilestoneForm((p) => ({ ...p, dueDate: value }))}
              />
              <Button
                size="sm"
                onClick={() => void addMilestone()}
                disabled={
                  !milestoneForm.name || !milestoneForm.dueDate || createMilestoneMutation.isPending
                }
              >
                Add Milestone
              </Button>
            </div>
            <ul className="space-y-2">
              {milestones.map((milestone) => (
                <li
                  key={String(milestone.id)}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <span>{String(milestone.name)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void removeMilestone(String(milestone.id))}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Sprints</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Sprint name"
                value={sprintForm.name}
                onChange={(e) => setSprintForm((p) => ({ ...p, name: e.target.value }))}
              />
              <DatePicker
                value={sprintForm.startDate}
                onChange={(value) => setSprintForm((p) => ({ ...p, startDate: value }))}
                max={sprintForm.endDate || undefined}
              />
              <DatePicker
                value={sprintForm.endDate}
                onChange={(value) => setSprintForm((p) => ({ ...p, endDate: value }))}
                min={sprintForm.startDate || undefined}
              />
              <Input
                placeholder="Goal"
                value={sprintForm.goal}
                onChange={(e) => setSprintForm((p) => ({ ...p, goal: e.target.value }))}
              />
            </div>
            <Button
              size="sm"
              onClick={() => void addSprint()}
              disabled={
                !sprintForm.name ||
                !sprintForm.startDate ||
                !sprintForm.endDate ||
                createSprintMutation.isPending
              }
            >
              Add Sprint
            </Button>
            <ul className="space-y-2">
              {sprints.map((sprint) => (
                <li key={String(sprint.id)} className="rounded border px-3 py-2 text-sm">
                  <p className="font-medium">{String(sprint.name)}</p>
                  <p className="text-muted-foreground">
                    {String(sprint.status)} · {String(sprint.startDate)} → {String(sprint.endDate)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Repository & Deployment</h3>
            <p className="text-xs text-muted-foreground">
              Save here to update the Deployment tab. URLs sync to both project settings and the
              knowledge base.
            </p>
            <Input
              placeholder="Repository URL"
              value={kbForm.repositoryUrl}
              onChange={(e) => setKbForm((p) => ({ ...p, repositoryUrl: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Production deploy URL"
                value={kbForm.productionUrl}
                onChange={(e) => setKbForm((p) => ({ ...p, productionUrl: e.target.value }))}
              />
              <Input
                placeholder="Development deploy URL"
                value={kbForm.stagingUrl}
                onChange={(e) => setKbForm((p) => ({ ...p, stagingUrl: e.target.value }))}
              />
            </div>
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2 font-mono text-sm"
              placeholder="Environment variables (KEY=value per line)"
              value={kbForm.envVariables}
              onChange={(e) => setKbForm((p) => ({ ...p, envVariables: e.target.value }))}
            />
            <textarea
              className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Deployment guide"
              value={kbForm.deploymentGuide}
              onChange={(e) => setKbForm((p) => ({ ...p, deploymentGuide: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Cloudflare email"
                value={kbForm.cloudflareEmail}
                onChange={(e) => setKbForm((p) => ({ ...p, cloudflareEmail: e.target.value }))}
              />
              <Input
                placeholder="Dev hosting platform"
                value={kbForm.devHostingPlatform}
                onChange={(e) => setKbForm((p) => ({ ...p, devHostingPlatform: e.target.value }))}
              />
              <Input
                placeholder="Prod hosting platform"
                value={kbForm.prodHostingPlatform}
                onChange={(e) => setKbForm((p) => ({ ...p, prodHostingPlatform: e.target.value }))}
              />
            </div>
            <textarea
              className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Architecture notes"
              value={kbForm.architectureNotes}
              onChange={(e) => setKbForm((p) => ({ ...p, architectureNotes: e.target.value }))}
            />
            <Button
              size="sm"
              onClick={() => void saveKnowledgeBase()}
              disabled={upsertKbMutation.isPending || updateMutation.isPending}
            >
              Save Deployment Settings
            </Button>
          </section>
        </>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete project?"
        description="This permanently removes the project and cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          setConfirmDelete(false);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
