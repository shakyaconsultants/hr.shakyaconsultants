import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Plus, Users } from 'lucide-react';
import { useCandidates, useExportCandidates } from '@/features/recruitment/hooks/use-recruitment';
import { RecruitmentNav } from '@/features/recruitment/components/recruitment-nav';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';
import type { CandidateRecord } from '@/features/recruitment/api/recruitment.api';

function formatStage(slug: string): string {
  return slug.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function CandidatesListPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCandidates({
    search: search || undefined,
    pipelineStage: stageFilter || undefined,
    pageSize: 50,
  });
  const exportMutation = useExportCandidates();

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
          {formatStage(row.pipelineStage)}
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

  if (isLoading) {
    return <Loading message="Loading candidates..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Candidates</h1>
          </div>
          <p className="text-sm text-muted-foreground">Search, filter, and manage applicant records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild>
            <Link to={ROUTES.RECRUITMENT_CANDIDATE_CREATE}>
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Link>
          </Button>
        </div>
      </div>

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

      {isError && <p className="text-destructive">Failed to load candidates. Ensure you are authenticated.</p>}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        onRowClick={(row) => navigate(ROUTES.recruitmentCandidateDetail(row.id))}
      />
    </div>
  );
}
