import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GitBranch, Plus } from 'lucide-react';
import { ApprovalNav } from '@/features/approval/components/approval-nav';
import { useCreateWorkflow, useUpdateWorkflow, useWorkflows } from '@/features/approval/hooks/use-approval';
import type { ApprovalWorkflow } from '@/features/approval/api/approval.api';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Loading } from '@/shared/components/loading';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { Sheet } from '@/shared/components/ui/sheet';
import { useAuthStore } from '@/shared/stores/app.store';

const REQUEST_TYPES = ['leave', 'attendance_correction', 'resignation', 'account_activation', 'project_approval', 'salary_revision', 'payroll_run'];

export function ApprovalWorkflowsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useWorkflows();
  const createMutation = useCreateWorkflow();
  const updateMutation = useUpdateWorkflow();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [editing, setEditing] = useState<ApprovalWorkflow | 'new' | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    requestType: REQUEST_TYPES[0],
    description: '',
    isDefault: false,
    stages: [{ order: 1, name: 'Manager Review', slug: 'manager_review', approverType: 'manager', isRequired: true }],
  });

  function openCreate() {
    setForm({
      name: '',
      slug: '',
      requestType: REQUEST_TYPES[0],
      description: '',
      isDefault: false,
      stages: [{ order: 1, name: 'Manager Review', slug: 'manager_review', approverType: 'manager', isRequired: true }],
    });
    setEditing('new');
  }

  useEffect(() => {
    if (searchParams.get('action') === 'create' && hasPermission('workflow.manage') && editing === null) {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, editing, setSearchParams, hasPermission]);

  function openEdit(workflow: ApprovalWorkflow) {
    setForm({
      name: workflow.name,
      slug: workflow.slug,
      requestType: workflow.requestType,
      description: '',
      isDefault: workflow.isDefault,
      stages: (workflow.stages ?? []).map((s) => ({ ...s, isRequired: true })),
    });
    setEditing(workflow);
  }

  async function saveWorkflow() {
    if (editing === 'new') {
      await createMutation.mutateAsync(form);
    } else if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload: form });
    }
    setEditing(null);
  }

  if (isLoading) return <Loading message="Loading workflows..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<GitBranch className="h-6 w-6 text-primary" />}
        title="Workflow Builder"
        description="Configure approval chains, levels, escalation, and defaults without code."
        actions={
          hasPermission('workflow.manage') ? (
            <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Workflow</Button>
          ) : null
        }
      />
      <ApprovalNav />

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing === 'new' ? 'Create Workflow' : 'Edit Workflow'}
        description="Configure approval stages without leaving the workflow list."
        className="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void saveWorkflow()} disabled={createMutation.isPending || updateMutation.isPending}>
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
            <select className="h-10 rounded-md border px-3 text-sm" value={form.requestType} onChange={(e) => setForm((p) => ({ ...p, requestType: e.target.value }))}>
              {REQUEST_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} />Default workflow</label>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Stages</p>
            {form.stages.map((stage, index) => (
              <div key={`${stage.slug}-${index}`} className="grid gap-2 md:grid-cols-4">
                <Input value={stage.name} onChange={(e) => setForm((p) => ({ ...p, stages: p.stages.map((s, i) => i === index ? { ...s, name: e.target.value } : s) }))} />
                <Input value={stage.slug} onChange={(e) => setForm((p) => ({ ...p, stages: p.stages.map((s, i) => i === index ? { ...s, slug: e.target.value } : s) }))} />
                <select className="h-10 rounded-md border px-3 text-sm" value={stage.approverType} onChange={(e) => setForm((p) => ({ ...p, stages: p.stages.map((s, i) => i === index ? { ...s, approverType: e.target.value } : s) }))}>
                  {['manager', 'role', 'employee', 'hierarchy_level'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <Input type="number" placeholder="SLA hours" onChange={(e) => setForm((p) => ({ ...p, stages: p.stages.map((s, i) => i === index ? { ...s, slaHours: Number(e.target.value) } : s) }))} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setForm((p) => ({ ...p, stages: [...p.stages, { order: p.stages.length + 1, name: `Stage ${p.stages.length + 1}`, slug: `stage_${p.stages.length + 1}`, approverType: 'manager', isRequired: true }] }))}>Add Stage</Button>
          </div>
        </div>
      </Sheet>

      <PageDataBoundary isLoading={isLoading} source="approval-workflows">
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((workflow) => (
            <section key={workflow.id} className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">{workflow.name}</h2>
                <div className="flex gap-2">
                  {workflow.isDefault ? <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Default</span> : null}
                  {hasPermission('workflow.manage') ? <Button variant="outline" size="sm" onClick={() => openEdit(workflow)}>Edit</Button> : null}
                </div>
              </div>
              <p className="mb-4 text-xs text-muted-foreground capitalize">{(workflow.requestType ?? '').replace(/_/g, ' ')}</p>
              <ol className="space-y-2">
                {[...(workflow.stages ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((stage) => (
                  <li key={stage.slug} className="flex items-center gap-2 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">{stage.order}</span>
                    {stage.name} <span className="text-xs text-muted-foreground">({stage.approverType})</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </PageDataBoundary>
    </div>
  );
}
