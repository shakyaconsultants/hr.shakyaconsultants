import { Link } from 'react-router-dom';
import { Kanban } from 'lucide-react';
import { useLeadKanban, useMoveLeadStage } from '@/features/sales/hooks/use-sales';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';
import type { Lead } from '@/features/sales/api/sales.api';

interface LeadPipelineBoardProps {
  pipelineId?: string;
  readOnly?: boolean;
}

export function LeadPipelineBoard({ pipelineId, readOnly = false }: LeadPipelineBoardProps) {
  const { data, isLoading, isError } = useLeadKanban(pipelineId);
  const moveStage = useMoveLeadStage();

  if (isLoading) {
    return <Loading message="Loading pipeline board..." />;
  }

  if (isError || !data) {
    return <p className="text-destructive">Failed to load pipeline board.</p>;
  }

  const sortedColumns = [...data.columns].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Kanban className="h-4 w-4" />
        <span>{data.pipelineName}</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedColumns.map((column) => (
          <div key={column.stageId} className="min-w-[280px] flex-shrink-0 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{column.stageName}</h2>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">{column.leads.length}</span>
            </div>
            <div className="space-y-2 p-3">
              {column.leads.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">No leads</p>
              ) : (
                column.leads.map((lead) => (
                  <LeadKanbanCard
                    key={lead.id}
                    lead={lead}
                    readOnly={readOnly}
                    onMove={(stageId) => moveStage.mutate({ id: lead.id, payload: { stageId, pipelineId: data.pipelineId } })}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadKanbanCard({
  lead,
  readOnly,
  onMove,
}: {
  lead: Lead;
  readOnly: boolean;
  onMove: (stageId: string) => void;
}) {
  return (
    <div className="rounded-md border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <Link to={ROUTES.salesLeadDetail(lead.id)} className="block">
        <p className="font-medium">
          {lead.firstName} {lead.lastName}
        </p>
        {lead.company ? <p className="truncate text-xs text-muted-foreground">{lead.company}</p> : null}
        {lead.estimatedValue != null ? (
          <p className="mt-1 text-xs font-medium text-primary">
            {lead.currency ?? 'INR'} {lead.estimatedValue.toLocaleString()}
          </p>
        ) : null}
      </Link>
      {!readOnly && lead.stageId ? (
        <select
          className="mt-2 w-full rounded border p-1 text-xs"
          value={lead.stageId}
          onChange={(e) => onMove(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          <option value={lead.stageId}>Move stage...</option>
        </select>
      ) : null}
      {lead.priority ? (
        <span className="mt-2 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize">{lead.priority}</span>
      ) : null}
    </div>
  );
}
