import { useState } from 'react';
import { useLeavePolicies, useSeedLeaveDefaults } from '@/features/leave-exit/hooks/use-leave-exit';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

export function LeavePoliciesPanel() {
  const canManage = useAuthStore((s) => s.hasPermission('leave.policy.manage'));
  const { data, isLoading } = useLeavePolicies();
  const seedDefaults = useSeedLeaveDefaults();
  const [message, setMessage] = useState<string | null>(null);

  if (isLoading) return <Loading message="Loading leave policies..." />;

  const policies = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Leave Policies</h3>
          <p className="text-sm text-muted-foreground">
            Operational rules — quotas, half-day, carry-forward, and department/branch scope.
            Employees apply leave against policies.
          </p>
        </div>
        {canManage ? (
          <Button
            variant="outline"
            size="sm"
            disabled={seedDefaults.isPending}
            onClick={() => {
              setMessage(null);
              void seedDefaults
                .mutateAsync()
                .then(() => setMessage('Default policies created from leave types.'));
            }}
          >
            {seedDefaults.isPending ? 'Seeding…' : 'Seed Policies from Types'}
          </Button>
        ) : null}
      </div>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {policies.length === 0 ? (
          <p className="text-muted-foreground">
            No policies yet.{canManage ? ' Add leave types first, then seed policies.' : ''}
          </p>
        ) : (
          policies.map((policy) => (
            <article key={policy.id} className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{policy.name}</h2>
                  <p className="text-xs text-muted-foreground">{policy.code}</p>
                </div>
                <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                  {policy.category.replace(/_/g, ' ')}
                </span>
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
                  <dd className="font-medium">
                    {policy.allowNegativeBalance ? 'Allowed' : 'Not allowed'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Carry Forward</dt>
                  <dd className="font-medium">{policy.carryForwardEnabled ? 'Yes' : 'No'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Scope</dt>
                  <dd className="font-medium">
                    {policy.applicableDepartmentIds?.length
                      ? `${policy.applicableDepartmentIds.length} department(s)`
                      : policy.applicableBranchIds?.length
                        ? `${policy.applicableBranchIds.length} branch(es)`
                        : 'Company-wide'}
                  </dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
