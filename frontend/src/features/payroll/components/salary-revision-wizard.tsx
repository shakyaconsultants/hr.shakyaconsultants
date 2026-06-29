import { FormEvent, useState } from 'react';
import { useCreateSalaryRevision, useEmployeeCompensation } from '@/features/payroll/hooks/use-payroll';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { DatePicker } from '@/shared/components/date-picker';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

interface SalaryRevisionWizardProps {
  employeeId: string;
  onSuccess?: () => void;
}

type WizardStep = 'review' | 'revise' | 'confirm';

export function SalaryRevisionWizard({ employeeId, onSuccess }: SalaryRevisionWizardProps) {
  const { data: compensation, isLoading } = useEmployeeCompensation(employeeId);
  const createRevision = useCreateSalaryRevision();

  const [step, setStep] = useState<WizardStep>('review');
  const [newSalary, setNewSalary] = useState(0);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return <Loading message="Loading current compensation..." />;
  }

  const currentSalary = compensation?.baseSalary ?? 0;
  const increment = newSalary - currentSalary;
  const incrementPct = currentSalary > 0 ? ((increment / currentSalary) * 100).toFixed(1) : '—';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (createRevision.isPending) {
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Salary revision created successfully.',
      mutation: () => createRevision.mutateAsync({ employeeId, newSalary, effectiveFrom, reason }),
      onSuccess: () => {
        onSuccess?.();
        setStep('review');
        setNewSalary(0);
        setEffectiveFrom('');
        setReason('');
      },
    });
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex gap-2">
        {(['review', 'revise', 'confirm'] as const).map((s, index) => (
          <div
            key={s}
            className={`flex-1 rounded border p-2 text-center text-xs capitalize ${
              step === s ? 'border-primary bg-primary/5 font-medium' : 'text-muted-foreground'
            }`}
          >
            {index + 1}. {s}
          </div>
        ))}
      </div>

      {step === 'review' ? (
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Current Compensation</h3>
          {compensation ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Structure</dt>
                <dd>{compensation.salaryStructure?.name ?? compensation.salaryStructureId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Base Salary</dt>
                <dd>
                  {compensation.currency} {compensation.baseSalary.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Effective From</dt>
                <dd>{new Date(compensation.effectiveFrom).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="capitalize">{compensation.isLocked ? 'Locked' : compensation.status}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No compensation on record. Assign compensation first.</p>
          )}
          <Button onClick={() => setStep('revise')} disabled={!compensation}>
            Continue to Revision
          </Button>
        </section>
      ) : null}

      {step === 'revise' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep('confirm');
          }}
          className="space-y-4 rounded-lg border bg-card p-4"
        >
          <h3 className="font-semibold">Propose Revision</h3>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">New Salary</span>
            <input
              type="number"
              min={0}
              className="w-full rounded-md border p-2"
              value={newSalary || ''}
              onChange={(e) => setNewSalary(Number(e.target.value))}
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Effective From</span>
            <DatePicker value={effectiveFrom} onChange={setEffectiveFrom} required />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Reason</span>
            <textarea
              className="w-full rounded-md border p-2"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep('review')}>
              Back
            </Button>
            <Button type="submit">Review Changes</Button>
          </div>
        </form>
      ) : null}

      {step === 'confirm' ? (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Confirm Revision</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Current Salary</dt>
              <dd>{currentSalary.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">New Salary</dt>
              <dd>{newSalary.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Change</dt>
              <dd className={increment >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {increment >= 0 ? '+' : ''}
                {increment.toLocaleString()} ({incrementPct}%)
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Effective From</dt>
              <dd>{effectiveFrom ? new Date(effectiveFrom).toLocaleDateString() : '—'}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground">Reason: {reason}</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep('revise')}>
              Back
            </Button>
            <Button type="submit" disabled={createRevision.isPending}>
              {createRevision.isPending ? 'Submitting...' : 'Submit Revision'}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
