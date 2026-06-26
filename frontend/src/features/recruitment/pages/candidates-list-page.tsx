import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Plus, Users } from 'lucide-react';
import { useCandidates, useExportCandidates } from '@/features/recruitment/hooks/use-recruitment';
import { CandidateCreateDialog } from '@/features/recruitment/components/candidate-create-dialog';
import { RecruitmentNav } from '@/features/recruitment/components/recruitment-nav';
import { DataTable } from '@/shared/components/data-table';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';
import type { CandidateRecord } from '@/features/recruitment/api/recruitment.api';
import { useAuthStore } from '@/shared/stores/app.store';

function formatStage(slug: string): string {
  return (slug ?? '')
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function CandidatesListPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('candidate.create');
  const canExport = hasPermission('candidate.read');
  const { data, isLoading, isError, error, refetch } = useCandidates({
    search: search || undefined,
    pipelineStage: stageFilter || undefined,
    pageSize: 50,
  });
  const exportMutation = useExportCandidates();

  useEffect(() => {
    if (searchParams.get('action') === 'create' && canCreate) {
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, canCreate]);

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row: CandidateRecord) => (
        <Link to={ROUTES.recruitmentCandidateDetail(row.id)} className="font-medium text-primary hover:underline">
          {row.firstName} {row.lastName}
        </Link>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', render: (row: CandidateRecord) => row.phone ?? '—' },
    {
      key: 'pipelineStage',
      header: 'Stage',
      render: (row: CandidateRecord) => (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {formatStage(row.pipelineStage ?? '')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: CandidateRecord) => (row.isArchived ? 'Archived' : 'Active'),
    },
  ];

  async function handleExport() {
    const blob = await exportMutation.mutateAsync({});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'candidates.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="h-6 w-6 text-primary" />}
        title="Candidates"
        description="Search, filter, and manage applicant records."
        breadcrumbs={[
          { label: 'Recruitment', href: ROUTES.RECRUITMENT },
          { label: 'Candidates' },
        ]}
        actions={
          <div className="flex gap-2">
            {canExport ? (
              <Button variant="outline" onClick={() => void handleExport()} disabled={exportMutation.isPending}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            ) : null}
            {canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            ) : null}
          </div>
        }
      />

      <RecruitmentNav />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-md"
        />
        <Input
          placeholder="Filter by stage slug..."
          value={stageFilter}
          onChange={(event) => setStageFilter(event.target.value)}
          className="max-w-xs"
        />
      </div>

      <PageDataBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        source="candidates-list"
      >
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          emptyTitle="No candidates yet"
          emptyMessage="Add a candidate or adjust your filters."
          emptyAction={
            canCreate ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            ) : undefined
          }
          onRowClick={(row) => navigate(ROUTES.recruitmentCandidateDetail(row.id))}
        />
      </PageDataBoundary>

      {canCreate ? <CandidateCreateDialog open={createOpen} onOpenChange={setCreateOpen} /> : null}
    </div>
  );
}
