import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Plus } from 'lucide-react';
import { useCreateProject, useProjects } from '@/features/project/hooks/use-projects';
import { EmployeeSearchSelect } from '@/shared/components/employee-search-select';
import { FormSection } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { FilterBar } from '@/shared/components/filter-bar';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { DatePicker } from '@/shared/components/date-picker';
import { Input } from '@/shared/components/ui/input';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
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
    const code =
      createForm.name
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 12) || `PRJ${Date.now()}`;

    const created = await createMutation.mutateAsync({
      ...createForm,
      code,
      description: createForm.description || undefined,
      clientName: createForm.clientName || undefined,
    });
    setShowCreate(false);
    navigate(ROUTES.projectDetail(created.id));
  }

  if (isLoading && !data) {
    return null;
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
        <section className="rounded-lg border bg-card p-4">
          <FormSection title="New Project" description="Create a project with essential business fields only.">
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField label="Project Name" required>
                <Input
                  placeholder="Project name"
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </SelectField>
              <SelectField label="Client">
                <Input
                  placeholder="Client name"
                  value={createForm.clientName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, clientName: event.target.value }))}
                />
              </SelectField>
              <SelectField label="Project Manager" required>
                <EmployeeSearchSelect
                  value={createForm.projectManagerId}
                  onChange={(value) => setCreateForm((prev) => ({ ...prev, projectManagerId: value }))}
                  required
                />
              </SelectField>
              <SelectField label="Start Date" required>
                <DatePicker
                  value={createForm.startDate}
                  onChange={(value) => setCreateForm((prev) => ({ ...prev, startDate: value }))}
                  required
                />
              </SelectField>
            </div>
            <SelectField label="Description">
              <textarea
                className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Description"
                value={createForm.description}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </SelectField>
            <div className="flex gap-2">
              <Button
                onClick={() => void handleCreateProject()}
                disabled={createMutation.isPending || !createForm.name || !createForm.projectManagerId}
              >
                Create Project
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </FormSection>
        </section>
      ) : null}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search projects…"
        onReset={() => {
          setSearch('');
          setShowArchived(false);
        }}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
      />

      {isError ? <p className="text-destructive">Failed to load projects.</p> : null}

      <PageDataBoundary isLoading={isLoading} isError={isError} source="projects-list">
        <DataTable columns={columns} data={data?.items ?? []} onRowClick={(row) => navigate(ROUTES.projectDetail(row.id))} />
      </PageDataBoundary>
    </div>
  );
}
