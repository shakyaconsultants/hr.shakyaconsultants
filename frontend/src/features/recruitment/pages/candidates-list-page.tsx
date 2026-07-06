import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useCandidates, useExportCandidates } from '@/features/recruitment/hooks/use-recruitment';
import { CandidateCreateDialog } from '@/features/recruitment/components/candidate-create-dialog';
import { RecruitmentNav } from '@/features/recruitment/components/recruitment-nav';
import { DataTable } from '@/shared/components/data-table';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { PageHeader } from '@/shared/components/page-header';
import { FilterBar, FilterField } from '@/shared/components/filter-bar';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import type { CandidateRecord } from '@/features/recruitment/api/recruitment.api';
import { useAuthStore } from '@/shared/stores/app.store';

import {
  formatWorkflowStage,
  WORKFLOW_STAGE_FILTER_OPTIONS,
} from '@/features/recruitment/constants/recruitment-workflow.constants';
import { getCandidateDisplayName } from '@/features/recruitment/utils/recruitment-display.util';

const PIPELINE_STAGE_OPTIONS = WORKFLOW_STAGE_FILTER_OPTIONS;

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
        <Link
          to={ROUTES.recruitmentCandidateDetail(row.id)}
          className="font-medium text-primary hover:underline"
        >
          {getCandidateDisplayName(row)}
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
          {formatWorkflowStage(row.pipelineStage ?? '')}
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
        breadcrumbs={[{ label: 'Recruitment', href: ROUTES.RECRUITMENT }, { label: 'Candidates' }]}
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          ) : undefined
        }
      />

      <RecruitmentNav />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or phone…"
        onExport={canExport ? () => void handleExport() : undefined}
        exportLabel="Export CSV"
      >
        <FilterField label="Stage">
          <AsyncSearchSelect
            value={stageFilter}
            options={PIPELINE_STAGE_OPTIONS}
            placeholder="All stages"
            onChange={setStageFilter}
            clearable={false}
          />
        </FilterField>
      </FilterBar>

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
