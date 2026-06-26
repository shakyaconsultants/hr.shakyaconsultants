import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateEmployee } from '@/features/employee/hooks/use-employees';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';

export function EmployeeCreatePage() {
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

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const employee = await createMutation.mutateAsync({
      ...form,
      joinedAt: new Date(form.joinedAt),
    });
    navigate(ROUTES.employeeDetail(employee.id));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to={ROUTES.EMPLOYEES} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Employees
      </Link>

      <h1 className="text-2xl font-bold">Add Employee</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">First Name</label>
            <Input value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Last Name</label>
            <Input value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <Input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Department ID</label>
            <Input value={form.departmentId} onChange={(e) => updateField('departmentId', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Designation ID</label>
            <Input value={form.designationId} onChange={(e) => updateField('designationId', e.target.value)} required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Branch ID</label>
            <Input value={form.branchId} onChange={(e) => updateField('branchId', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Joining Date</label>
            <Input type="date" value={form.joinedAt} onChange={(e) => updateField('joinedAt', e.target.value)} required />
          </div>
        </div>

        <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
          {createMutation.isPending ? 'Creating...' : 'Create Employee'}
        </Button>
      </form>
    </div>
  );
}
