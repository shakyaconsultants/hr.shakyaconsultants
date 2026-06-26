import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEmployee } from '@/features/employee/hooks/use-employees';
import { FormDialog } from '@/shared/components/form-dialog';
import { FormLabel } from '@/shared/components/form-label';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';

export interface EmployeeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeCreateDialog({ open, onOpenChange }: EmployeeCreateDialogProps) {
  const navigate = useNavigate();
  const createMutation = useCreateEmployee();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designationId: '',
    branchId: '',
    joinedAt: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState<string | null>(null);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setError(null);
    try {
      const employee = await createMutation.mutateAsync({
        ...form,
        joinedAt: new Date(form.joinedAt),
      });
      onOpenChange(false);
      navigate(ROUTES.employeeDetail(employee.id));
    } catch {
      setError('Failed to create employee. Check required fields and try again.');
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Employee"
      description="Create a new employee record without leaving the directory."
      submitLabel="Create Employee"
      isSubmitting={createMutation.isPending}
      onSubmit={handleSubmit}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="employee-first-name">First Name</FormLabel>
            <Input id="employee-first-name" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} required />
          </div>
          <div>
            <FormLabel htmlFor="employee-last-name">Last Name</FormLabel>
            <Input id="employee-last-name" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} required />
          </div>
        </div>
        <div>
          <FormLabel htmlFor="employee-email">Email</FormLabel>
          <Input id="employee-email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
        </div>
        <div>
          <FormLabel htmlFor="employee-phone">Phone</FormLabel>
          <Input id="employee-phone" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="employee-department">Department ID</FormLabel>
            <Input id="employee-department" value={form.departmentId} onChange={(e) => updateField('departmentId', e.target.value)} required />
          </div>
          <div>
            <FormLabel htmlFor="employee-designation">Designation ID</FormLabel>
            <Input id="employee-designation" value={form.designationId} onChange={(e) => updateField('designationId', e.target.value)} required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="employee-branch">Branch ID</FormLabel>
            <Input id="employee-branch" value={form.branchId} onChange={(e) => updateField('branchId', e.target.value)} />
          </div>
          <div>
            <FormLabel htmlFor="employee-joined-at">Joining Date</FormLabel>
            <Input id="employee-joined-at" type="date" value={form.joinedAt} onChange={(e) => updateField('joinedAt', e.target.value)} required />
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </FormDialog>
  );
}
