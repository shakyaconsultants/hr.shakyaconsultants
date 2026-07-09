import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
} from '@/features/payroll/constants/payroll-structure.constants';
import {
  buildComponentOverrides,
  computeCtcBreakdown,
  resolveEffectiveComponents,
} from '@/features/payroll/utils/ctc-breakdown.util';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
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

function formatComponentType(component: SalaryComponent): string {
  if (component.type === 'percentage') {
    return `${component.amount}% of basic`;
  }
  return 'Fixed';
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
  const [baseSalary, setBaseSalary] = useState(25_000);
  const [enabledComponents, setEnabledComponents] = useState<Record<string, boolean>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [structureReady, setStructureReady] = useState(false);
  const hydratedFromExisting = useRef(false);
  const initializedStructure = useRef(false);

  const selectedStructure = structures?.items.find((item) => item.id === salaryStructureId);
  const structureComponents = selectedStructure?.components ?? buildTemplateComponents();

  useEffect(() => {
    if (structuresLoading || initializedStructure.current) return;

    const standard =
      structures?.items.find((item) => item.code === INDIA_STANDARD_PAYROLL_TEMPLATE.code) ??
      structures?.items[0];

    if (standard) {
      setSalaryStructureId(standard.id);
      if (!hydratedFromExisting.current) {
        setEnabledComponents(buildDefaultComponentEnabled(standard.components));
      }
      if (!existing?.baseSalary && standard.baseSalary > 0) {
        setBaseSalary(standard.baseSalary);
      }
      initializedStructure.current = true;
      setStructureReady(true);
      return;
    }

    if ((structures?.items.length ?? 0) === 0 && !createStructure.isPending) {
      void createStructure
        .mutateAsync({
          name: INDIA_STANDARD_PAYROLL_TEMPLATE.name,
          code: INDIA_STANDARD_PAYROLL_TEMPLATE.code,
          baseSalary: 25_000,
          currency: INDIA_STANDARD_PAYROLL_TEMPLATE.currency,
          components: buildTemplateComponents(),
        })
        .then((created) => {
          setSalaryStructureId(created.id);
          if (!hydratedFromExisting.current) {
            setEnabledComponents(buildDefaultComponentEnabled(created.components));
          }
          initializedStructure.current = true;
          setStructureReady(true);
        })
        .catch(() => {
          initializedStructure.current = true;
          setStructureReady(true);
        });
    }
  }, [structures, structuresLoading, createStructure, existing?.baseSalary]);

  useEffect(() => {
    if (!existing || hydratedFromExisting.current) return;
    hydratedFromExisting.current = true;

    if (existing.salaryStructureId) {
      setSalaryStructureId(existing.salaryStructureId);
    }
    if (existing.baseSalary > 0) {
      setBaseSalary(existing.baseSalary);
    }

    const enabled = buildDefaultComponentEnabled(existing.salaryStructure?.components ?? []);
    const amounts: Record<string, number> = {};

    for (const override of existing.componentOverrides ?? []) {
      if (override.amount === 0) {
        enabled[override.code] = false;
        continue;
      }
      amounts[override.code] = override.amount;
    }

    setEnabledComponents(enabled);
    setCustomAmounts(amounts);
  }, [existing]);

  const componentOverrides = useMemo(
    () => buildComponentOverrides(structureComponents, enabledComponents, customAmounts),
    [structureComponents, enabledComponents, customAmounts],
  );

  const breakdown = useMemo(() => {
    if (!baseSalary) return null;
    return computeCtcBreakdown({
      baseSalary,
      components: structureComponents,
      componentOverrides,
      currency: selectedStructure?.currency ?? 'INR',
    });
  }, [baseSalary, structureComponents, componentOverrides, selectedStructure?.currency]);

  const getRowAmount = (component: SalaryComponent): number => {
    if (customAmounts[component.code] !== undefined) {
      return customAmounts[component.code];
    }
    return resolveComponentAmount(component, baseSalary);
  };

  const toggleComponent = (code: string, checked: boolean) => {
    setEnabledComponents((prev) => ({ ...prev, [code]: checked }));
  };

  const setComponentAmount = (code: string, amount: number) => {
    setCustomAmounts((prev) => ({ ...prev, [code]: amount }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (assignCompensation.isPending || !salaryStructureId || baseSalary <= 0) {
      setError('Enter a valid basic salary before saving.');
      return;
    }

    const effectiveFrom = existing?.effectiveFrom ?? new Date().toISOString().slice(0, 10);

    await runFormMutation({
      setError,
      successMessage: existing ? 'Salary structure updated.' : 'Salary structure saved.',
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

  if (existingLoading || structuresLoading || !structureReady) {
    return <Loading message="Loading salary components..." />;
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-8">
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h4 className="font-semibold">Step 3 — Salary components</h4>
        <p className="text-sm text-muted-foreground">
          Toggle optional allowances on or off. Edit monthly amounts directly. Core components
          (Basic, HRA, Special Allowance) are always included.
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
                <td className="px-4 py-2.5 text-right">
                  <Input
                    type="number"
                    min={0}
                    className="ml-auto w-32 text-right"
                    value={baseSalary || ''}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    required
                  />
                </td>
              </tr>
              {structureComponents.map((component) => {
                const optional = isOptionalComponent(component);
                const enabled = enabledComponents[component.code] !== false;
                const amount = getRowAmount(component);

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
                    <td className="px-4 py-2.5 font-medium">{component.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatComponentType(component)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {enabled ? (
                        <Input
                          type="number"
                          min={0}
                          className="ml-auto w-32 text-right"
                          value={amount}
                          onChange={(e) =>
                            setComponentAmount(component.code, Number(e.target.value))
                          }
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={assignCompensation.isPending || !salaryStructureId}>
        {assignCompensation.isPending ? 'Saving...' : existing ? 'Update salary' : 'Save salary'}
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
