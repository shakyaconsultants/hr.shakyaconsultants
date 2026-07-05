import { useState } from 'react';
import { LeaveExitNav, LeaveExitPageHeader } from '@/features/leave-exit/components/leave-exit-nav';
import { useAdjustLeaveBalance, useLeaveBalances, useLeavePolicies } from '@/features/leave-exit/hooks/use-leave-exit';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function LeaveBalancesPage() {
  const canManage = useAuthStore((s) => s.hasPermission('leave.balance.manage'));
  const { data: employees, isLoading: employeesLoading } = useAllEmployees({ status: 'active' });
  const [employeeId, setEmployeeId] = useState('');
  const [adjustPolicyId, setAdjustPolicyId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const { data: policies } = useLeavePolicies();
  const { data, isLoading } = useLeaveBalances(employeeId || undefined);
  const adjustBalance = useAdjustLeaveBalance();

  if (employeesLoading) return <Loading message="Loading employees..." />;

  const selectedEmployee = employees?.find((e) => e.id === employeeId);

  return (
    <div className="space-y-6">
      <LeaveExitPageHeader
        title="Leave Balances"
        description="Select an employee to view balances. Admins can adjust earned days."
      />
      <LeaveExitNav />

      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Employee</span>
          <select
            className="block min-w-[240px] rounded-md border bg-background px-3 py-2 text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Select employee...</option>
            {(employees ?? []).map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} ({employee.employeeNumber})
              </option>
            ))}
          </select>
        </label>
      </div>

      {!employeeId ? (
        <p className="text-sm text-muted-foreground">Choose an employee to view their leave balances.</p>
      ) : isLoading ? (
        <Loading message="Loading leave balances..." />
      ) : (
        <>
          {selectedEmployee ? (
            <p className="text-sm text-muted-foreground">
              Showing balances for {selectedEmployee.firstName} {selectedEmployee.lastName}
            </p>
          ) : null}

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
                      No balance records for this employee
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

          {canManage ? (
            <section className="max-w-lg space-y-3 rounded-lg border p-4">
              <h2 className="font-semibold">Bonus / Reward Adjustment</h2>
              <p className="text-xs text-muted-foreground">Add earned leave days for performance rewards, festival bonuses, or manual corrections.</p>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Policy</span>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={adjustPolicyId}
                  onChange={(e) => setAdjustPolicyId(e.target.value)}
                >
                  <option value="">Select policy...</option>
                  {(policies ?? []).map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Adjustment (+/- days)</span>
                <Input
                  type="number"
                  step="0.5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 2 or -1"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Notes</span>
                <Input value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} placeholder="Reason for adjustment" />
              </label>
              <Button
                disabled={!adjustPolicyId || !adjustAmount || !adjustNotes.trim() || adjustBalance.isPending}
                onClick={() => {
                  void adjustBalance.mutateAsync({
                    employeeId,
                    leavePolicyId: adjustPolicyId,
                    amount: Number(adjustAmount),
                    notes: adjustNotes.trim(),
                  });
                }}
              >
                {adjustBalance.isPending ? 'Saving...' : 'Apply Adjustment'}
              </Button>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
