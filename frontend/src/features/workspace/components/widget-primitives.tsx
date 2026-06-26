export { EmptyState } from '@/shared/components/empty-state';

export function WidgetSkeleton({ title }: { title?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse" aria-busy="true" aria-label={title ? `Loading ${title}` : 'Loading widget'}>
      <div className="mb-3 h-4 w-1/3 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="h-3 w-3/5 rounded bg-muted" />
      </div>
    </div>
  );
}


export function WidgetCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
