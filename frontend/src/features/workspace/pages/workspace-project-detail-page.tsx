import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import {
  useMyProject,
  useSubmitTaskForVerification,
} from '@/features/workspace/hooks/use-workspace';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import type { TaskRecord } from '@/features/workspace/api/workspace.api';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';

const TABS = ['Overview', 'My Tasks', 'Team'] as const;

function formatStatus(slug: string): string {
  return slug
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function canSubmitTask(status: string): boolean {
  return ['todo', 'assigned', 'in_progress', 'backlog', 'blocked', 'rejected'].includes(status);
}

export function WorkspaceProjectDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [formError, setFormError] = useState<string | null>(null);
  const { data, isLoading, isError, error: loadError, refetch } = useMyProject(id);
  const submitMutation = useSubmitTaskForVerification();

  if (isLoading || isError || !data) {
    return (
      <PageDataBoundary
        isLoading={isLoading}
        isError={isError}
        error={loadError}
        onRetry={() => void refetch()}
        source="workspace-project-detail"
        loadingFallback={<div className="p-8 text-muted-foreground">Loading project...</div>}
      >
        {null}
      </PageDataBoundary>
    );
  }

  const project = data.project;
  const projectName = String(project.name ?? '');
  const projectCode = String(project.code ?? '');

  async function handleSubmit(task: TaskRecord) {
    setFormError(null);
    await runFormMutation({
      setError: setFormError,
      successMessage: 'Task submitted for manager review.',
      mutation: () => submitMutation.mutateAsync(task.id),
    });
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.WORKSPACE_PROJECTS}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        My Projects
      </Link>

      <WorkspacePageHeader
        title={projectName}
        description={`${projectCode} · ${formatStatus(data.role)} · View only`}
      />

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {formatStatus(String(project.status ?? ''))}
        </span>
        {Boolean(project.projectKind) && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
            {String(project.projectKind) === 'internal' ? 'In-house' : 'External'}
          </span>
        )}
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">Read-only access</span>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        {activeTab === 'Overview' && (
          <dl className="grid gap-4 sm:grid-cols-2">
            {Boolean(project.description) && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Summary</dt>
                <dd className="mt-1">{String(project.description)}</dd>
              </div>
            )}
            {Boolean(project.requirements) && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Requirements</dt>
                <dd className="mt-1 whitespace-pre-wrap">{String(project.requirements)}</dd>
              </div>
            )}
            {Boolean(project.uiDocs) && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">UI / Design Docs</dt>
                <dd className="mt-1 whitespace-pre-wrap">{String(project.uiDocs)}</dd>
              </div>
            )}
            {Boolean(project.scalabilityNotes) && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Tech Stack & Scalability</dt>
                <dd className="mt-1 whitespace-pre-wrap">{String(project.scalabilityNotes)}</dd>
              </div>
            )}
            {Boolean(project.startDate) && (
              <div>
                <dt className="text-sm text-muted-foreground">Start Date</dt>
                <dd>{new Date(String(project.startDate)).toLocaleDateString()}</dd>
              </div>
            )}
            {Boolean(project.endDate) && (
              <div>
                <dt className="text-sm text-muted-foreground">End Date</dt>
                <dd>{new Date(String(project.endDate)).toLocaleDateString()}</dd>
              </div>
            )}
            {Boolean(project.clientName) && (
              <div>
                <dt className="text-sm text-muted-foreground">Client</dt>
                <dd>{String(project.clientName)}</dd>
              </div>
            )}
            {data.deployment.repositoryUrl && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Repository</dt>
                <dd className="mt-1">
                  <a
                    href={data.deployment.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {data.deployment.repositoryUrl} <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            )}
            {data.deployment.productionUrl && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Deployment</dt>
                <dd className="mt-1">
                  <a
                    href={data.deployment.productionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {data.deployment.productionUrl} <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            )}
            {data.deployment.deploymentGuide && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Deployment Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.deployment.deploymentGuide}</dd>
              </div>
            )}
            {(data.deployment.documentUrls?.length ?? 0) > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Reference Documents</dt>
                <dd className="mt-1">
                  <ul className="list-disc pl-5 text-sm">
                    {data.deployment.documentUrls!.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        )}

        {activeTab === 'My Tasks' && (
          <div className="space-y-3">
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            {data.myTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks assigned to you on this project yet.
              </p>
            ) : (
              data.myTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatStatus(task.status)}
                      {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                    </p>
                    {task.status === 'rejected' && (
                      <p className="mt-1 text-xs text-destructive">
                        Sent back for revision — update and resubmit
                      </p>
                    )}
                    {task.status === 'completed' && (
                      <p className="mt-1 text-xs text-amber-600">
                        Waiting for manager verification
                      </p>
                    )}
                    {task.status === 'verified' && (
                      <p className="mt-1 text-xs text-green-600">Approved by manager</p>
                    )}
                  </div>
                  {canSubmitTask(task.status) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={submitMutation.isPending}
                      onClick={() => void handleSubmit(task)}
                    >
                      Submit for Verification
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Team' && (
          <ul className="space-y-2 text-sm">
            {data.members.map((member) => (
              <li
                key={String(member.id)}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <span className="font-mono text-xs">{String(member.employeeId)}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs">
                  {formatStatus(String(member.role ?? 'member'))}
                </span>
              </li>
            ))}
            {data.members.length === 0 && (
              <p className="text-muted-foreground">No team members listed.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
