import { FormEvent, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAssignCompensation, useEmployeeCompensation, useSalaryStructures } from '@/features/payroll/hooks/use-payroll';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

interface CompensationAssignmentFormProps {
  employeeId: string;
  onSuccess?: () => void;
}

export function CompensationAssignmentForm({ employeeId, onSuccess }: CompensationAssignmentFormProps) {
  const { data: existing, isLoading: existingLoading } = useEmployeeCompensation(employeeId);
  const { data: structures } = useSalaryStructures({ pageSize: 100, status: 'active' });
  const assignCompensation = useAssignCompensation();

  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (existingLoading) {
    return <Loading message="Loading compensation..." />;
  }

  if (existing?.isLocked) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Compensation is locked</p>
          <p className="mt-1 text-amber-800">
            This employee&apos;s compensation cannot be edited after payroll lock. Use the salary revision wizard to
            schedule a future change.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!salaryStructureId || !effectiveFrom) return;
    try {
      await assignCompensation.mutateAsync({ employeeId, salaryStructureId, baseSalary, effectiveFrom });
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign compensation');
    }
  };

  const onStructureChange = (structureId: string) => {
    setSalaryStructureId(structureId);
    const structure = structures?.items.find((s) => s.id === structureId);
    if (structure) {
      setBaseSalary(structure.baseSalary);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="max-w-xl space-y-4">
      {existing ? (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p>
            Current: {existing.salaryStructure?.name ?? existing.salaryStructureId} — {existing.currency}{' '}
            {existing.baseSalary.toLocaleString()} (from {new Date(existing.effectiveFrom).toLocaleDateString()})
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No compensation assigned yet.</p>
      )}

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Salary Structure</span>
        <select
          className="w-full rounded-md border p-2"
          value={salaryStructureId}
          onChange={(e) => onStructureChange(e.target.value)}
          required
        >
          <option value="">Select structure...</option>
          {(structures?.items ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Base Salary</span>
        <input
          type="number"
          min={0}
          className="w-full rounded-md border p-2"
          value={baseSalary}
          onChange={(e) => setBaseSalary(Number(e.target.value))}
          required
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Effective From</span>
        <input
          type="date"
          className="w-full rounded-md border p-2"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          required
        />
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={assignCompensation.isPending}>
        {assignCompensation.isPending ? 'Saving...' : existing ? 'Update Assignment' : 'Assign Compensation'}
      </Button>
    </form>
  );
}
