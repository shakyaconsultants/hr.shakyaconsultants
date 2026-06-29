import { WorkspaceLeaveNav } from '@/features/workspace/components/workspace-leave-nav';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { useLeaveBalances } from '@/features/leave-exit/hooks/use-leave-exit';
import { Loading } from '@/shared/components/loading';
import { useAuthStore } from '@/shared/stores/app.store';

export function WorkspaceLeaveBalancePage() {
  const employeeId = useAuthStore((s) => s.user?.employeeId ?? s.employee?.id);
  const { data, isLoading } = useLeaveBalances(employeeId);

  if (isLoading) return <Loading message="Loading your leave balance..." />;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        title="My Leave Balance"
        description="Opening, earned, used, pending, and available balances for your account."
      />
      <WorkspaceLeaveNav />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3">Policy</th>
              <th className="p-3">Opening</th>
              <th className="p-3">Earned</th>
              <th className="p-3">Used</th>
              <th className="p-3">Pending</th>
              <th className="p-3">Available</th>
              <th className="p-3">Carry Forward</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No balance records
                </td>
              </tr>
            ) : (
              (data ?? []).map((balance) => (
                <tr key={balance.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{balance.policy?.name ?? balance.leavePolicyId}</td>
                  <td className="p-3">{balance.openingBalance}</td>
                  <td className="p-3">{balance.earned}</td>
                  <td className="p-3">{balance.used}</td>
                  <td className="p-3">{balance.pending}</td>
                  <td className="p-3 font-semibold">{balance.available}</td>
                  <td className="p-3">{balance.carryForward}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
