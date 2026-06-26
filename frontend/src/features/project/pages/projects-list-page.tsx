import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Plus } from 'lucide-react';
import { useCreateProject, useProjects } from '@/features/project/hooks/use-projects';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import type { ProjectRecord } from '@/features/project/api/project.api';

export function ProjectsListPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    projectManagerId: '',
    startDate: new Date().toISOString().slice(0, 10),
    clientName: '',
  });
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { data, isLoading, isError } = useProjects({
    search: search || undefined,
    pageSize: 50,
    includeArchived: showArchived || undefined,
  });
  const { data: employees } = useEmployees({ pageSize: 200 });
  const createMutation = useCreateProject();

  useEffect(() => {
    if (searchParams.get('action') === 'create' && hasPermission('project.create')) {
      navigate(ROUTES.PROJECTS_CREATE, { replace: true });
    }
  }, [searchParams, navigate, hasPermission]);

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row: ProjectRecord) => (
        <Link to={ROUTES.projectDetail(row.id)} className="font-mono text-primary hover:underline">{row.code}</Link>
      ),
    },
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
    { key: 'priority', header: 'Priority' },
    {
      key: 'client',
      header: 'Client',
      render: (row: ProjectRecord) => row.clientName ?? '—',
    },
    {
      key: 'archived',
      header: 'Archived',
      render: (row: ProjectRecord) => (row.isArchived ? 'Yes' : 'No'),
    },
  ];

  async function handleCreateProject() {
    const created = await createMutation.mutateAsync({
      ...createForm,
      description: createForm.description || undefined,
      clientName: createForm.clientName || undefined,
    });
    setShowCreate(false);
    navigate(ROUTES.projectDetail(created.id));
  }

  if (isLoading) {
    return <Loading message="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Briefcase className="h-6 w-6 text-primary" />}
        title="Enterprise Project Administration"
        description="View and manage every project — create, configure, archive, and override permissions."
        actions={
          hasPermission('project.create') ? (
            <Button size="sm" asChild>
              <Link to={ROUTES.PROJECTS_CREATE}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          ) : null
        }
      />

      {showCreate && hasPermission('project.create') ? (
        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Create Project</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Project name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Code" value={createForm.code} onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <Input placeholder="Client" value={createForm.clientName} onChange={(e) => setCreateForm((p) => ({ ...p, clientName: e.target.value }))} />
            <Input type="date" value={createForm.startDate} onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))} />
            <select className="h-10 rounded-md border px-3 text-sm" value={createForm.projectManagerId} onChange={(e) => setCreateForm((p) => ({ ...p, projectManagerId: e.target.value }))}>
              <option value="">Project manager</option>
              {(employees?.items ?? []).map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>
              ))}
            </select>
          </div>
          <textarea className="min-h-20 w-full rounded-md border px-3 py-2 text-sm" placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={() => void handleCreateProject()} disabled={createMutation.isPending || !createForm.name || !createForm.code || !createForm.projectManagerId}>
              Create Project
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Include archived
        </label>
      </div>

      {isError && <p className="text-destructive">Failed to load projects.</p>}

      <DataTable columns={columns} data={data?.items ?? []} onRowClick={(row) => navigate(ROUTES.projectDetail(row.id))} />
    </div>
  );
}
