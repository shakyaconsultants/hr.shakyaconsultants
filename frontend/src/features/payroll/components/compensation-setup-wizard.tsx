import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { AnnexureASalaryTable } from '@/features/payroll/components/annexure-a-salary-table';
import {
  useAssignCompensation,
  useCreateSalaryStructure,
  useEmployeeCompensation,
  useSalaryStructures,
} from '@/features/payroll/hooks/use-payroll';
import type { SalaryComponent } from '@/features/payroll/api/payroll.api';
import {
  buildDefaultComponentEnabled,
  buildTemplateComponents,
  INDIA_STANDARD_PAYROLL_TEMPLATE,
  isOptionalComponent,
  suggestBasicFromAnnualCtc,
} from '@/features/payroll/constants/payroll-structure.constants';
import {
  buildComponentOverrides,
  computeCtcBreakdown,
  resolveEffectiveComponents,
} from '@/features/payroll/utils/ctc-breakdown.util';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { DatePicker } from '@/shared/components/date-picker';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

interface CompensationSetupWizardProps {
  employeeId: string;
  onSuccess?: () => void;
}

function resolveComponentAmount(component: SalaryComponent, basicSalary: number): number {
  if (component.type === 'percentage') {
    return Math.round((basicSalary * component.amount) / 100);
  }
  return component.amount;
}

export function CompensationSetupWizard({ employeeId, onSuccess }: CompensationSetupWizardProps) {
  const { data: existing, isLoading: existingLoading } = useEmployeeCompensation(employeeId);
  const { data: structures, isLoading: structuresLoading } = useSalaryStructures({
    pageSize: 100,
    status: 'active',
  });
  const assignCompensation = useAssignCompensation();
  const createStructure = useCreateSalaryStructure();

  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [annualCtc, setAnnualCtc] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [enabledComponents, setEnabledComponents] = useState<Record<string, boolean>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const selectedStructure = structures?.items.find((item) => item.id === salaryStructureId);
  const structureComponents = selectedStructure?.components ?? [];

  useEffect(() => {
    if (!selectedStructure) return;
    setEnabledComponents(buildDefaultComponentEnabled(selectedStructure.components));
    setCustomAmounts({});
    if (!baseSalary && selectedStructure.baseSalary > 0) {
      setBaseSalary(selectedStructure.baseSalary);
    }
  }, [selectedStructure?.id]);

  useEffect(() => {
    if (existing?.salaryStructureId && !salaryStructureId) {
      setSalaryStructureId(existing.salaryStructureId);
      setBaseSalary(existing.baseSalary);
      const enabled = buildDefaultComponentEnabled(existing.salaryStructure?.components ?? []);
      for (const override of existing.componentOverrides ?? []) {
        if (override.amount === 0) {
          enabled[override.code] = false;
        }
      }
      setEnabledComponents(enabled);
    }
  }, [existing, salaryStructureId]);

  const componentOverrides = useMemo(
    () => buildComponentOverrides(structureComponents, enabledComponents, customAmounts),
    [structureComponents, enabledComponents, customAmounts],
  );

  const breakdown = useMemo(() => {
    if (!baseSalary || !selectedStructure) return null;
    return computeCtcBreakdown({
      baseSalary,
      components: selectedStructure.components,
      componentOverrides,
      currency: selectedStructure.currency,
    });
  }, [baseSalary, selectedStructure, componentOverrides]);

  if (existingLoading || structuresLoading) {
    return <Loading message="Loading compensation setup..." />;
  }

  if (existing?.isLocked) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Compensation is locked</p>
          <p className="mt-1 text-amber-800">
            Use the salary revision wizard to schedule a future change.
          </p>
        </div>
      </div>
    );
  }

  const createCompanyStandardStructure = async () => {
    const basic = annualCtc ? suggestBasicFromAnnualCtc(Number(annualCtc)) : 25000;
    const created = await createStructure.mutateAsync({
      name: INDIA_STANDARD_PAYROLL_TEMPLATE.name,
      code: INDIA_STANDARD_PAYROLL_TEMPLATE.code,
      baseSalary: basic,
      currency: INDIA_STANDARD_PAYROLL_TEMPLATE.currency,
      components: buildTemplateComponents(),
    });
    setSalaryStructureId(created.id);
    setBaseSalary(basic);
  };

  const onStructureChange = (structureId: string) => {
    setSalaryStructureId(structureId);
    const structure = structures?.items.find((item) => item.id === structureId);
    if (structure) {
      setBaseSalary(structure.baseSalary);
    }
  };

  const applyAnnualCtc = () => {
    const annual = Number(annualCtc);
    if (!Number.isFinite(annual) || annual <= 0) return;
    setBaseSalary(suggestBasicFromAnnualCtc(annual));
  };

  const toggleComponent = (code: string, checked: boolean) => {
    setEnabledComponents((prev) => ({ ...prev, [code]: checked }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (assignCompensation.isPending) return;
    if (!salaryStructureId || !effectiveFrom || baseSalary <= 0) {
      setError('Select a company salary structure, enter basic salary, and set effective date.');
      return;
    }

    await runFormMutation({
      setError,
      successMessage: existing
        ? 'Compensation updated successfully.'
        : 'Compensation assigned successfully.',
      mutation: () =>
        assignCompensation.mutateAsync({
          employeeId,
          salaryStructureId,
          baseSalary,
          effectiveFrom,
          componentOverrides,
        }),
      onSuccess: () => onSuccess?.(),
    });
  };

  const hasStructures = (structures?.items.length ?? 0) > 0;

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-8">
      <section className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <h4 className="font-semibold">Step 1 — Company salary structure</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Salary is built from a company-wide structure (Annexure A template). Create the standard
          structure once, then assign it to each employee with optional components toggled on or
          off.
        </p>

        {!hasStructures ? (
          <div className="mt-4 rounded-lg border border-dashed bg-background p-4">
            <p className="text-sm text-muted-foreground">No company salary structures yet.</p>
            <Button
              type="button"
              className="mt-3"
              size="sm"
              onClick={() => void createCompanyStandardStructure()}
              disabled={createStructure.isPending}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {createStructure.isPending ? 'Creating...' : 'Create India Standard CTC structure'}
            </Button>
          </div>
        ) : (
          <label className="mt-4 block space-y-1 text-sm">
            <span className="font-medium">Select structure</span>
            <select
              className="w-full max-w-xl rounded-md border bg-background p-2"
              value={salaryStructureId}
              onChange={(e) => onStructureChange(e.target.value)}
              required
            >
              <option value="">Choose company salary structure...</option>
              {(structures?.items ?? []).map((structure) => (
                <option key={structure.id} value={structure.id}>
                  {structure.name} ({structure.code}) — {structure.components.length} components
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      {selectedStructure ? (
        <>
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h4 className="font-semibold">Step 2 — Basic salary & CTC</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Basic salary (monthly)</span>
                <Input
                  type="number"
                  min={0}
                  value={baseSalary || ''}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  required
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Target annual CTC (optional)</span>
                <Input
                  type="number"
                  value={annualCtc}
                  onChange={(e) => setAnnualCtc(e.target.value)}
                  placeholder="e.g. 1200000"
                />
              </label>
              <div className="flex items-end">
                <Button type="button" variant="outline" size="sm" onClick={applyAnnualCtc}>
                  Suggest basic from CTC
                </Button>
              </div>
            </div>
            <label className="block max-w-xs space-y-1 text-sm">
              <span className="font-medium">Effective from</span>
              <DatePicker value={effectiveFrom} onChange={setEffectiveFrom} required />
            </label>
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h4 className="font-semibold">Step 3 — Salary components</h4>
            <p className="text-sm text-muted-foreground">
              Toggle optional allowances on or off. Core components (Basic, HRA, Special Allowance)
              are always included.
            </p>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-4 py-2.5 font-medium">Include</th>
                    <th className="px-4 py-2.5 font-medium">Component</th>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 text-right font-medium">Monthly amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-muted/10">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked disabled aria-label="Basic always included" />
                    </td>
                    <td className="px-4 py-2.5 font-medium">Basic Salary</td>
                    <td className="px-4 py-2.5 text-muted-foreground">Fixed</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      ₹{baseSalary.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {structureComponents.map((component) => {
                    const optional = isOptionalComponent(component);
                    const enabled = enabledComponents[component.code] !== false;
                    const amount =
                      customAmounts[component.code] ??
                      resolveComponentAmount(component, baseSalary);

                    return (
                      <tr key={component.code} className="border-b last:border-b-0">
                        <td className="px-4 py-2.5">
                          {optional ? (
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => toggleComponent(component.code, e.target.checked)}
                              aria-label={`Include ${component.name}`}
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked
                              disabled
                              aria-label={`${component.name} required`}
                            />
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium">{component.name}</span>
                          {component.isVariable ? (
                            <span className="ml-1 text-xs text-amber-600">*</span>
                          ) : null}
                          {(component as SalaryComponent & { description?: string }).description ? (
                            <p className="text-xs text-muted-foreground">
                              {
                                (component as SalaryComponent & { description?: string })
                                  .description
                              }
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {component.type === 'percentage'
                            ? `${component.amount}% of basic`
                            : 'Fixed'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {enabled && optional && component.isVariable ? (
                            <Input
                              type="number"
                              min={0}
                              className="ml-auto w-28 text-right"
                              value={amount}
                              onChange={(e) =>
                                setCustomAmounts((prev) => ({
                                  ...prev,
                                  [component.code]: Number(e.target.value),
                                }))
                              }
                            />
                          ) : (
                            <span className="tabular-nums text-muted-foreground">
                              {enabled ? `₹${amount.toLocaleString('en-IN')}` : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {breakdown ? (
            <section className="space-y-3">
              <h4 className="font-semibold">Step 4 — Preview (Annexure A)</h4>
              <AnnexureASalaryTable breakdown={breakdown} />
            </section>
          ) : null}
        </>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={assignCompensation.isPending || !salaryStructureId}>
        {assignCompensation.isPending
          ? 'Saving...'
          : existing
            ? 'Update compensation'
            : 'Assign compensation'}
      </Button>
    </form>
  );
}

export function compensationBreakdownFromAssignment(
  baseSalary: number,
  components: SalaryComponent[] | undefined,
  componentOverrides: Array<{ code: string; amount: number; type?: string }> | undefined,
  currency?: string,
) {
  return computeCtcBreakdown({
    baseSalary,
    components: resolveEffectiveComponents(components ?? [], componentOverrides),
    currency,
  });
}
