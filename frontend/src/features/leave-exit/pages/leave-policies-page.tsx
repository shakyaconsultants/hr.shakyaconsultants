import { LeaveExitNav, LeaveExitPageHeader } from '@/features/leave-exit/components/leave-exit-nav';
import { useLeavePolicies } from '@/features/leave-exit/hooks/use-leave-exit';
import { Loading } from '@/shared/components/loading';

export function LeavePoliciesPage() {
  const { data, isLoading } = useLeavePolicies();

  if (isLoading) return <Loading message="Loading leave policies..." />;

  return (
    <div className="space-y-6">
      <LeaveExitPageHeader title="Leave Policies" description="Configurable leave types, quotas, and rules." />
      <LeaveExitNav />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).length === 0 ? (
          <p className="text-muted-foreground">No policies configured.</p>
        ) : (
          (data ?? []).map((policy) => (
            <article key={policy.id} className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{policy.name}</h2>
                  <p className="text-xs text-muted-foreground">{policy.code}</p>
                </div>
                <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{policy.category.replace(/_/g, ' ')}</span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Annual Quota</dt>
                  <dd className="font-medium">{policy.annualQuota}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Half Day</dt>
                  <dd className="font-medium">{policy.allowHalfDay ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Negative Balance</dt>
                  <dd className="font-medium">{policy.allowNegativeBalance ? 'Allowed' : 'Not allowed'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Carry Forward</dt>
                  <dd className="font-medium">{policy.carryForwardEnabled ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
