import { Link } from 'react-router-dom';
import { Kanban } from 'lucide-react';
import { useKanban } from '@/features/recruitment/hooks/use-recruitment';
import { RecruitmentNav } from '@/features/recruitment/components/recruitment-nav';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { PageHeader } from '@/shared/components/page-header';
import { ROUTES } from '@/config/app.config';
import type { CandidateRecord } from '@/features/recruitment/api/recruitment.api';
import { getCandidateDisplayName } from '@/features/recruitment/utils/recruitment-display.util';

export function PipelineKanbanPage() {
  const { data, isLoading, isError, error, refetch } = useKanban();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Kanban className="h-6 w-6 text-primary" />}
        title="Pipeline"
        description="Kanban view of candidates across recruitment stages."
        breadcrumbs={[{ label: 'Recruitment', href: ROUTES.RECRUITMENT }, { label: 'Pipeline' }]}
      />

      <RecruitmentNav />

      <PageDataBoundary
        isLoading={isLoading}
        isError={isError || !data}
        error={error}
        onRetry={() => void refetch()}
        source="pipeline-kanban"
      >
        <PipelineBoard data={data!} />
      </PageDataBoundary>
    </div>
  );
}

function PipelineBoard({ data }: { data: NonNullable<ReturnType<typeof useKanban>['data']> }) {
  const sortedStages = [...(data.stages ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const columns = data.columns ?? {};

  if (sortedStages.length === 0) {
    return <p className="text-sm text-muted-foreground">No pipeline stages configured.</p>;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {sortedStages.map((stage) => {
        const cards = columns[stage.slug] ?? [];
        return (
          <div key={stage.id} className="min-w-[280px] flex-shrink-0 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{stage.name ?? stage.slug}</h2>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                {cards.length}
              </span>
            </div>
            <div className="space-y-2 p-3">
              {cards.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">No candidates</p>
              ) : (
                cards.map((candidate) => <KanbanCard key={candidate.id} candidate={candidate} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ candidate }: { candidate: CandidateRecord }) {
  const tags = candidate.tags ?? [];
  return (
    <Link
      to={ROUTES.recruitmentCandidateDetail(candidate.id)}
      className="block rounded-md border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="font-medium">{getCandidateDisplayName(candidate)}</p>
      <p className="truncate text-xs text-muted-foreground">{candidate.email ?? ''}</p>
      {tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
