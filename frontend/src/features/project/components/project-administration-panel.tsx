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
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const MEMBER_ROLES = ['project_manager', 'assistant_project_manager', 'developer', 'qa', 'designer', 'devops', 'business_analyst', 'intern', 'owner', 'viewer'];

export interface ProjectAdministrationPanelProps {
  project: ProjectRecord;
}

export function ProjectAdministrationPanel({ project }: ProjectAdministrationPanelProps) {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canUpdate = hasPermission('project.update');
  const canDelete = hasPermission('project.delete');

  const { data: employees } = useEmployees({ pageSize: 200 });
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
    code: project.code,
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
    envVariables: '',
    deploymentGuide: '',
    architectureNotes: '',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm({
      name: project.name,
      code: project.code,
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
  }, [project]);

  useEffect(() => {
    if (knowledgeBase) {
      setKbForm({
        repositoryUrl: knowledgeBase.repositoryUrl ?? '',
        envVariables: knowledgeBase.envVariables ?? '',
        deploymentGuide: knowledgeBase.deploymentGuide ?? '',
        architectureNotes: knowledgeBase.architectureNotes ?? '',
      });
    }
  }, [knowledgeBase]);

  if (!canUpdate && !canDelete) {
    return null;
  }

  async function saveSettings() {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id: project.id,
        payload: {
          name: settingsForm.name,
          code: settingsForm.code,
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
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update project');
    }
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(project.id);
    navigate(ROUTES.PROJECTS_LIST);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Enterprise Administration</h2>
          <p className="text-sm text-muted-foreground">Full project control — override permissions and configure all project assets.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && !project.isArchived ? (
            <Button variant="outline" size="sm" onClick={() => void archiveMutation.mutateAsync(project.id)}>Archive</Button>
          ) : null}
          {canUpdate && project.isArchived ? (
            <Button variant="outline" size="sm" onClick={() => void restoreMutation.mutateAsync(project.id)}>Restore</Button>
          ) : null}
          {canDelete ? (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>Delete</Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {canUpdate ? (
        <>
          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Project Settings</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Name" value={settingsForm.name} onChange={(e) => setSettingsForm((p) => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Code" value={settingsForm.code} onChange={(e) => setSettingsForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
              <Input placeholder="Client" value={settingsForm.clientName} onChange={(e) => setSettingsForm((p) => ({ ...p, clientName: e.target.value }))} />
              <select className="h-10 rounded-md border px-3 text-sm" value={settingsForm.status} onChange={(e) => setSettingsForm((p) => ({ ...p, status: e.target.value }))}>
                {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <select className="h-10 rounded-md border px-3 text-sm" value={settingsForm.priority} onChange={(e) => setSettingsForm((p) => ({ ...p, priority: e.target.value }))}>
                {PROJECT_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
              <select className="h-10 rounded-md border px-3 text-sm" value={settingsForm.projectManagerId} onChange={(e) => setSettingsForm((p) => ({ ...p, projectManagerId: e.target.value }))}>
                <option value="">Select project manager</option>
                {(employees?.items ?? []).map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName} ({employee.employeeNumber})</option>
                ))}
              </select>
              <Input type="date" value={settingsForm.startDate} onChange={(e) => setSettingsForm((p) => ({ ...p, startDate: e.target.value }))} />
              <Input type="date" value={settingsForm.targetDate} onChange={(e) => setSettingsForm((p) => ({ ...p, targetDate: e.target.value }))} />
            </div>
            <textarea className="min-h-20 w-full rounded-md border px-3 py-2 text-sm" placeholder="Description" value={settingsForm.description} onChange={(e) => setSettingsForm((p) => ({ ...p, description: e.target.value }))} />
            <Button size="sm" onClick={() => void saveSettings()} disabled={updateMutation.isPending}>Save Settings</Button>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Team Members</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <select className="h-10 rounded-md border px-3 text-sm" value={memberForm.employeeId} onChange={(e) => setMemberForm((p) => ({ ...p, employeeId: e.target.value }))}>
                <option value="">Select employee</option>
                {(employees?.items ?? []).map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>
                ))}
              </select>
              <select className="h-10 rounded-md border px-3 text-sm" value={memberForm.role} onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))}>
                {MEMBER_ROLES.map((role) => <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>)}
              </select>
              <Button size="sm" onClick={() => void assignMemberMutation.mutateAsync({ projectId: project.id, ...memberForm }).then(() => { setMemberForm({ employeeId: '', role: 'developer' }); void refetchMembers(); })} disabled={!memberForm.employeeId}>
                Assign Member
              </Button>
            </div>
            <ul className="space-y-2">
              {members.map((member) => (
                <li key={String(member.id)} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{String(member.employeeId)} · {String(member.role)}</span>
                  <Button variant="ghost" size="sm" onClick={() => void removeMemberMutation.mutateAsync({ memberId: String(member.id), projectId: project.id }).then(() => void refetchMembers())}>Remove</Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Modules</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <Input placeholder="Module name" value={moduleForm.name} onChange={(e) => setModuleForm((p) => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Description" value={moduleForm.description} onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))} />
              <Button size="sm" onClick={() => void createModuleMutation.mutateAsync({ projectId: project.id, name: moduleForm.name, description: moduleForm.description || undefined }).then(() => { setModuleForm({ name: '', description: '' }); void refetchModules(); })} disabled={!moduleForm.name}>
                Add Module
              </Button>
            </div>
            <ul className="space-y-2">
              {modules.map((module) => (
                <li key={String(module.id)} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{String(module.name)}</span>
                  <Button variant="ghost" size="sm" onClick={() => void deleteModuleMutation.mutateAsync({ moduleId: String(module.id), projectId: project.id }).then(() => void refetchModules())}>Delete</Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Milestones</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <Input placeholder="Milestone name" value={milestoneForm.name} onChange={(e) => setMilestoneForm((p) => ({ ...p, name: e.target.value }))} />
              <Input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm((p) => ({ ...p, dueDate: e.target.value }))} />
              <Button size="sm" onClick={() => void createMilestoneMutation.mutateAsync({ projectId: project.id, name: milestoneForm.name, dueDate: milestoneForm.dueDate }).then(() => { setMilestoneForm({ name: '', dueDate: '' }); void refetchMilestones(); })} disabled={!milestoneForm.name || !milestoneForm.dueDate}>
                Add Milestone
              </Button>
            </div>
            <ul className="space-y-2">
              {milestones.map((milestone) => (
                <li key={String(milestone.id)} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{String(milestone.name)}</span>
                  <Button variant="ghost" size="sm" onClick={() => void deleteMilestoneMutation.mutateAsync({ milestoneId: String(milestone.id), projectId: project.id }).then(() => void refetchMilestones())}>Delete</Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Sprints</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              <Input placeholder="Sprint name" value={sprintForm.name} onChange={(e) => setSprintForm((p) => ({ ...p, name: e.target.value }))} />
              <Input type="date" value={sprintForm.startDate} onChange={(e) => setSprintForm((p) => ({ ...p, startDate: e.target.value }))} />
              <Input type="date" value={sprintForm.endDate} onChange={(e) => setSprintForm((p) => ({ ...p, endDate: e.target.value }))} />
              <Input placeholder="Goal" value={sprintForm.goal} onChange={(e) => setSprintForm((p) => ({ ...p, goal: e.target.value }))} />
            </div>
            <Button size="sm" onClick={() => void createSprintMutation.mutateAsync({ projectId: project.id, name: sprintForm.name, startDate: sprintForm.startDate, endDate: sprintForm.endDate, goal: sprintForm.goal || undefined }).then(() => { setSprintForm({ name: '', startDate: '', endDate: '', goal: '' }); void refetchSprints(); })} disabled={!sprintForm.name || !sprintForm.startDate || !sprintForm.endDate}>
              Add Sprint
            </Button>
            <ul className="space-y-2">
              {sprints.map((sprint) => (
                <li key={String(sprint.id)} className="rounded border px-3 py-2 text-sm">
                  <p className="font-medium">{String(sprint.name)}</p>
                  <p className="text-muted-foreground">{String(sprint.status)} · {String(sprint.startDate)} → {String(sprint.endDate)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Repository & Environment</h3>
            <Input placeholder="Repository URL" value={kbForm.repositoryUrl} onChange={(e) => setKbForm((p) => ({ ...p, repositoryUrl: e.target.value }))} />
            <textarea className="min-h-24 w-full rounded-md border px-3 py-2 font-mono text-sm" placeholder="Environment variables (KEY=value per line)" value={kbForm.envVariables} onChange={(e) => setKbForm((p) => ({ ...p, envVariables: e.target.value }))} />
            <textarea className="min-h-20 w-full rounded-md border px-3 py-2 text-sm" placeholder="Deployment guide" value={kbForm.deploymentGuide} onChange={(e) => setKbForm((p) => ({ ...p, deploymentGuide: e.target.value }))} />
            <textarea className="min-h-20 w-full rounded-md border px-3 py-2 text-sm" placeholder="Architecture notes" value={kbForm.architectureNotes} onChange={(e) => setKbForm((p) => ({ ...p, architectureNotes: e.target.value }))} />
            <Button size="sm" onClick={() => void upsertKbMutation.mutateAsync({ projectId: project.id, payload: kbForm })} disabled={upsertKbMutation.isPending}>
              Save Repository & Environment
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
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
