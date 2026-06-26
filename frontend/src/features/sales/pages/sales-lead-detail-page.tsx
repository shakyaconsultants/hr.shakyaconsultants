import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, MoveRight } from 'lucide-react';
import { LeadActivityForm } from '@/features/sales/components/lead-activity-form';
import {
  useLead,
  useLeadTimeline,
  useMoveLeadStage,
  usePipelines,
} from '@/features/sales/hooks/use-sales';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

const TABS = ['Overview', 'Timeline', 'Notes', 'Attachments'] as const;

export function SalesLeadDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [selectedStageId, setSelectedStageId] = useState('');

  const { data: lead, isLoading, isError } = useLead(id);
  const { data: timeline = [], isLoading: timelineLoading } = useLeadTimeline(id);
  const { data: pipelines } = usePipelines({ pageSize: 10 });

  const moveStage = useMoveLeadStage();

  const pipeline = pipelines?.items.find((p) => p.id === lead?.pipelineId);
  const stages = pipeline?.stages ?? [];

  if (isLoading) {
    return <Loading message="Loading lead details..." />;
  }

  if (isError || !lead) {
    return <p className="text-destructive">Failed to load lead details.</p>;
  }

  const handleMoveStage = async () => {
    if (!selectedStageId) return;
    await moveStage.mutateAsync({
      id,
      payload: { stageId: selectedStageId, pipelineId: lead.pipelineId },
    });
    setSelectedStageId('');
  };

  const notesActivities = timeline.filter((a) => a.type === 'note');
  const attachments = [
    ...(lead.attachmentUrls ?? []),
    ...timeline.flatMap((a) => a.attachmentUrls ?? []),
  ];

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.SALES_EXECUTIVE}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        My Sales
      </Link>

      <div className="flex flex-wrap items-start gap-6 rounded-lg border bg-card p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
          {lead.firstName.charAt(0)}
          {lead.lastName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">
            {lead.firstName} {lead.lastName}
          </h1>
          <p className="text-sm">{lead.email}</p>
          {lead.phone ? <p className="text-sm text-muted-foreground">{lead.phone}</p> : null}
          {lead.company ? <p className="text-sm text-muted-foreground">{lead.company}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
              {lead.status}
            </span>
            {lead.priority ? (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs capitalize">{lead.priority}</span>
            ) : null}
            {lead.score != null ? (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">Score: {lead.score}</span>
            ) : null}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {lead.assignedToName ?? lead.assignedToId ? (
            <p>
              <span className="text-muted-foreground">Assigned to:</span> {lead.assignedToName ?? lead.assignedToId}
            </p>
          ) : null}
          {lead.estimatedValue != null ? (
            <p>
              <span className="text-muted-foreground">Value:</span> {lead.currency ?? 'INR'}{' '}
              {lead.estimatedValue.toLocaleString()}
            </p>
          ) : null}
          {lead.expectedCloseDate ? (
            <p>
              <span className="text-muted-foreground">Expected close:</span>{' '}
              {new Date(lead.expectedCloseDate).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </div>

      {stages.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Move to Stage</span>
            <select
              className="rounded-md border p-2"
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
            >
              <option value="">Select stage...</option>
              {stages
                .sort((a, b) => a.order - b.order)
                .map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
            </select>
          </label>
          <Button size="sm" onClick={() => void handleMoveStage()} disabled={!selectedStageId || moveStage.isPending}>
            <MoveRight className="mr-1 h-4 w-4" />
            {moveStage.isPending ? 'Moving...' : 'Move Stage'}
          </Button>
        </div>
      ) : null}

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

      {activeTab === 'Overview' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Lead Details</h2>
            <dl className="space-y-2 text-sm">
              <DetailRow label="Source" value={lead.source ?? lead.sourceId} />
              <DetailRow label="Tags" value={lead.tags?.join(', ')} />
              <DetailRow label="Notes" value={lead.notes} />
              <DetailRow label="Internal Notes" value={lead.internalNotes} />
              {lead.lostReason ? <DetailRow label="Lost Reason" value={lead.lostReason} /> : null}
              {lead.wonReason ? <DetailRow label="Won Reason" value={lead.wonReason} /> : null}
            </dl>
          </section>
          <LeadActivityForm leadId={id} />
        </div>
      ) : null}

      {activeTab === 'Timeline' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Activity Timeline</h2>
          {timelineLoading ? (
            <Loading message="Loading timeline..." />
          ) : timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-4">
              {timeline.map((activity) => (
                <li key={activity.id} className="border-l-2 border-primary/30 pl-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium capitalize text-primary">{activity.type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.performedAt).toLocaleString()}
                    </span>
                    {activity.performedByName ? (
                      <span className="text-xs text-muted-foreground">by {activity.performedByName}</span>
                    ) : null}
                  </div>
                  {activity.title ? <p className="mt-1 font-medium">{activity.title}</p> : null}
                  <p className="text-sm">{activity.description}</p>
                  {activity.fromStageId && activity.toStageId ? (
                    <p className="mt-1 text-xs text-muted-foreground">Stage moved</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {activeTab === 'Notes' ? (
        <section className="space-y-4">
          <LeadActivityForm leadId={id} />
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Notes History</h2>
            {notesActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {notesActivities.map((note) => (
                  <li key={note.id} className="rounded border p-3 text-sm">
                    <p className="text-xs text-muted-foreground">{new Date(note.performedAt).toLocaleString()}</p>
                    <p className="mt-1">{note.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {lead.notes ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="mb-1 font-medium">Initial Notes</p>
              <p>{lead.notes}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'Attachments' ? (
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <h2 className="font-semibold">Attachments</h2>
          </div>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attachments uploaded.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((url, index) => (
                <li key={`${url}-${index}`}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {url.split('/').pop() ?? url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
