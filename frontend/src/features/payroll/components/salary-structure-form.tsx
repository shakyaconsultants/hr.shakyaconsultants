import { FormEvent, useState } from 'react';
import type { SalaryComponent, SalaryStructure } from '@/features/payroll/api/payroll.api';
import {
  useCreateSalaryStructure,
  useDeleteSalaryStructure,
  useSalaryStructures,
  useUpdateSalaryStructure,
} from '@/features/payroll/hooks/use-payroll';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';

const EMPTY_COMPONENT: SalaryComponent = {
  name: '',
  code: '',
  type: 'fixed',
  amount: 0,
  isTaxable: true,
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
  const [currency, setCurrency] = useState('INR');
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setBaseSalary(0);
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
    setComponents(structure.components ?? []);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = { name, code, baseSalary, currency, components };
      if (editingId) {
        await updateStructure.mutateAsync({ id: editingId, payload });
      } else {
        await createStructure.mutateAsync(payload);
      }
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save structure');
    }
  };

  const addComponent = () => setComponents([...components, { ...EMPTY_COMPONENT }]);

  const updateComponent = (index: number, field: keyof SalaryComponent, value: string | number | boolean) => {
    setComponents(components.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const removeComponent = (index: number) => setComponents(components.filter((_, i) => i !== index));

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => void onSubmit(e)} className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">{editingId ? 'Edit Salary Structure' : 'Create Salary Structure'}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name" value={name} onChange={setName} required />
          <Field label="Code" value={code} onChange={setCode} required />
          <Field label="Base Salary" type="number" value={String(baseSalary)} onChange={(v) => setBaseSalary(Number(v))} required />
          <Field label="Currency" value={currency} onChange={setCurrency} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Components</span>
            <Button type="button" variant="outline" size="sm" onClick={addComponent}>
              Add Component
            </Button>
          </div>
          {components.map((comp, index) => (
            <div key={index} className="grid gap-2 rounded border p-3 sm:grid-cols-6">
              <input className="rounded-md border p-2 text-sm" placeholder="Name" value={comp.name} onChange={(e) => updateComponent(index, 'name', e.target.value)} />
              <input className="rounded-md border p-2 text-sm" placeholder="Code" value={comp.code} onChange={(e) => updateComponent(index, 'code', e.target.value)} />
              <select className="rounded-md border p-2 text-sm" value={comp.type} onChange={(e) => updateComponent(index, 'type', e.target.value)}>
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
              </select>
              <input type="number" className="rounded-md border p-2 text-sm" placeholder="Amount" value={comp.amount} onChange={(e) => updateComponent(index, 'amount', Number(e.target.value))} />
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={comp.isTaxable} onChange={(e) => updateComponent(index, 'isTaxable', e.target.checked)} />
                Taxable
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeComponent(index)}>
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

      <DataTable
        columns={[
          { key: 'code', header: 'Code' },
          { key: 'name', header: 'Name' },
          {
            key: 'baseSalary',
            header: 'Base Salary',
            render: (row) => `${row.currency} ${row.baseSalary.toLocaleString()}`,
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
                  onClick={() => void deleteStructure.mutateAsync(row.id)}
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
        className="w-full rounded-md border p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}
