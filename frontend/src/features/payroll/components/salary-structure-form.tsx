import { FormEvent, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { SalaryStructure } from '@/features/payroll/api/payroll.api';
import {
  useCreateSalaryStructure,
  useDeleteSalaryStructure,
  useSalaryStructures,
  useUpdateSalaryStructure,
} from '@/features/payroll/hooks/use-payroll';
import { CtcBreakdownPanel } from '@/features/payroll/components/ctc-breakdown-panel';
import {
  buildTemplateComponents,
  INDIA_STANDARD_PAYROLL_TEMPLATE,
  PAYROLL_COMPONENT_CATEGORIES,
  suggestBasicFromAnnualCtc,
  type PayrollTemplateComponent,
} from '@/features/payroll/constants/payroll-structure.constants';
import { computeCtcBreakdown } from '@/features/payroll/utils/ctc-breakdown.util';
import { runDeleteMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const EMPTY_COMPONENT: PayrollTemplateComponent = {
  name: '',
  code: '',
  type: 'fixed',
  amount: 0,
  isTaxable: true,
  category: 'allowance',
};

export function SalaryStructureForm() {
  const { data: structures, isLoading } = useSalaryStructures({ pageSize: 50 });
  const createStructure = useCreateSalaryStructure();
  const updateStructure = useUpdateSalaryStructure();
  const deleteStructure = useDeleteSalaryStructure();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [annualCtcHint, setAnnualCtcHint] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [components, setComponents] = useState<PayrollTemplateComponent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const breakdown = useMemo(
    () => computeCtcBreakdown({ baseSalary, components, currency }),
    [baseSalary, components, currency],
  );

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setBaseSalary(0);
    setAnnualCtcHint('');
    setCurrency('INR');
    setComponents([]);
    setError(null);
  };

  const loadForEdit = (structure: SalaryStructure) => {
    setEditingId(structure.id);
    setName(structure.name);
    setCode(structure.code);
    setBaseSalary(structure.baseSalary);
    setCurrency(structure.currency);
    setComponents((structure.components ?? []) as PayrollTemplateComponent[]);
  };

  const loadStandardTemplate = () => {
    setName(INDIA_STANDARD_PAYROLL_TEMPLATE.name);
    setCode(INDIA_STANDARD_PAYROLL_TEMPLATE.code);
    setCurrency(INDIA_STANDARD_PAYROLL_TEMPLATE.currency);
    setComponents(buildTemplateComponents());
    if (annualCtcHint) {
      setBaseSalary(suggestBasicFromAnnualCtc(Number(annualCtcHint)));
    }
  };

  const applyAnnualCtc = () => {
    const annual = Number(annualCtcHint);
    if (!Number.isFinite(annual) || annual <= 0) return;
    setBaseSalary(suggestBasicFromAnnualCtc(annual));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (createStructure.isPending || updateStructure.isPending) return;

    await runFormMutation({
      setError,
      successMessage: editingId ? 'Salary structure updated successfully.' : 'Salary structure created successfully.',
      mutation: async () => {
        const payload = { name, code, baseSalary, currency, components };
        if (editingId) return updateStructure.mutateAsync({ id: editingId, payload });
        return createStructure.mutateAsync(payload);
      },
      onSuccess: () => resetForm(),
    });
  };

  const addComponent = () => setComponents([...components, { ...EMPTY_COMPONENT }]);

  const updateComponent = (
    index: number,
    field: keyof PayrollTemplateComponent,
    value: string | number | boolean,
  ) => {
    setComponents(components.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const removeComponent = (index: number) => setComponents(components.filter((_, i) => i !== index));

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <h3 className="text-lg font-semibold">India Standard Payroll Structure</h3>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Based on your company template: Basic Salary, HRA, Special Allowance, Conveyance, Meals,
          Attendance*, Performance Incentive*, plus PF, gratuity, and professional tax.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="default" size="sm" onClick={loadStandardTemplate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Load standard template
          </Button>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6 rounded-xl border bg-card p-6">
        <h3 className="font-semibold">{editingId ? 'Edit Salary Structure' : 'Create Salary Structure'}</h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Structure Name" value={name} onChange={setName} required />
          <Field label="Code" value={code} onChange={setCode} required />
          <Field
            label="Basic Salary (Monthly)"
            type="number"
            value={String(baseSalary)}
            onChange={(v) => setBaseSalary(Number(v))}
            required
          />
          <Field label="Currency" value={currency} onChange={setCurrency} />
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Target Annual CTC (optional)</span>
            <Input
              type="number"
              value={annualCtcHint}
              onChange={(e) => setAnnualCtcHint(e.target.value)}
              placeholder="e.g. 1200000"
            />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={applyAnnualCtc}>
            Suggest basic from CTC
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Salary Components</span>
            <Button type="button" variant="outline" size="sm" onClick={addComponent}>
              Add component
            </Button>
          </div>

          {components.map((comp, index) => (
            <div key={index} className="grid gap-2 rounded-lg border p-3 lg:grid-cols-12">
              <input
                className="rounded-md border bg-background p-2 text-sm lg:col-span-2"
                placeholder="Name"
                value={comp.name}
                onChange={(e) => updateComponent(index, 'name', e.target.value)}
              />
              <input
                className="rounded-md border bg-background p-2 text-sm lg:col-span-1"
                placeholder="Code"
                value={comp.code}
                onChange={(e) => updateComponent(index, 'code', e.target.value)}
              />
              <select
                className="rounded-md border bg-background p-2 text-sm lg:col-span-2"
                value={comp.category ?? 'allowance'}
                onChange={(e) => updateComponent(index, 'category', e.target.value)}
              >
                {PAYROLL_COMPONENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border bg-background p-2 text-sm lg:col-span-1"
                value={comp.type}
                onChange={(e) => updateComponent(index, 'type', e.target.value)}
              >
                <option value="fixed">Fixed</option>
                <option value="percentage">% of Basic</option>
              </select>
              <input
                type="number"
                className="rounded-md border bg-background p-2 text-sm lg:col-span-1"
                placeholder="Amount"
                value={comp.amount}
                onChange={(e) => updateComponent(index, 'amount', Number(e.target.value))}
              />
              <label className="flex items-center gap-1 text-xs lg:col-span-1">
                <input
                  type="checkbox"
                  checked={comp.isTaxable}
                  onChange={(e) => updateComponent(index, 'isTaxable', e.target.checked)}
                />
                Taxable
              </label>
              <label className="flex items-center gap-1 text-xs lg:col-span-1">
                <input
                  type="checkbox"
                  checked={Boolean(comp.isVariable)}
                  onChange={(e) => updateComponent(index, 'isVariable', e.target.checked)}
                />
                Variable*
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="lg:col-span-1"
                onClick={() => removeComponent(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={createStructure.isPending || updateStructure.isPending}>
            {editingId ? 'Update Structure' : 'Create Structure'}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {baseSalary > 0 ? (
        <section>
          <h3 className="mb-4 text-lg font-semibold">CTC Breakdown Preview</h3>
          <CtcBreakdownPanel breakdown={breakdown} />
        </section>
      ) : null}

      <DataTable
        columns={[
          { key: 'code', header: 'Code' },
          { key: 'name', header: 'Name' },
          {
            key: 'baseSalary',
            header: 'Basic (Monthly)',
            render: (row) => `${row.currency} ${row.baseSalary.toLocaleString('en-IN')}`,
          },
          {
            key: 'ctc',
            header: 'Est. Annual CTC',
            render: (row) => {
              const est = computeCtcBreakdown({
                baseSalary: row.baseSalary,
                components: row.components,
                currency: row.currency,
              });
              return `₹${est.annualCtc.toLocaleString('en-IN')}`;
            },
          },
          {
            key: 'components',
            header: 'Components',
            render: (row) => row.components.length,
          },
          { key: 'status', header: 'Status', render: (row) => <span className="capitalize">{row.status}</span> },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => loadForEdit(row)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    void runDeleteMutation({
                      entityLabel: 'Salary Structure',
                      successMessage: 'Salary structure deleted successfully.',
                      mutation: () => deleteStructure.mutateAsync(row.id),
                    })
                  }
                  disabled={deleteStructure.isPending}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={structures?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No salary structures configured"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        className="w-full rounded-md border bg-background p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}
